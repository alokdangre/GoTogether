from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status, Query
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from uuid import UUID
import json
from datetime import datetime

from ..core.database import get_db
from ..core.auth import verify_token, get_current_user, verify_admin_token, security
from ..models.chat import ChatMessage
from ..models.grouped_ride import GroupedRide
from ..models.ride_request import RideRequest
from ..models.user import User
from ..models.admin import Admin
from ..schemas.chat import ChatMessageCreate, ChatMessage as ChatMessageSchema

router = APIRouter(prefix="/api/chat", tags=["Chat"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, grouped_ride_id: str):
        await websocket.accept()
        if grouped_ride_id not in self.active_connections:
            self.active_connections[grouped_ride_id] = []
        self.active_connections[grouped_ride_id].append(websocket)

    def disconnect(self, websocket: WebSocket, grouped_ride_id: str):
        if grouped_ride_id in self.active_connections:
            if websocket in self.active_connections[grouped_ride_id]:
                self.active_connections[grouped_ride_id].remove(websocket)
            if not self.active_connections[grouped_ride_id]:
                del self.active_connections[grouped_ride_id]

    async def broadcast(self, message: dict, grouped_ride_id: str):
        if grouped_ride_id in self.active_connections:
            for connection in self.active_connections[grouped_ride_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

manager = ConnectionManager()

@router.get("/{grouped_ride_id}/history", response_model=List[ChatMessageSchema])
async def get_chat_history(
    grouped_ride_id: UUID,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    try:
        token = credentials.credentials
        actor = None
        
        # Check Admin
        admin_id = verify_admin_token(token)
        if admin_id:
            actor = {"type": "admin", "id": admin_id}
        else:
            # Check User
            verified = verify_token(token)
            if verified:
                user_id, _ = verified
                actor = {"type": "user", "id": user_id}
                
        if not actor:
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
        if actor["type"] == "user":
            # Verify participation
            is_participant = db.query(RideRequest).filter(
                RideRequest.user_id == actor["id"],
                RideRequest.grouped_ride_id == grouped_ride_id,
                RideRequest.status.in_(["grouped", "accepted", "assigned", "completed"])
            ).first()
            if not is_participant:
                raise HTTPException(status_code=403, detail="Not a participant")
                
        messages = db.query(ChatMessage).filter(
            ChatMessage.grouped_ride_id == grouped_ride_id
        ).order_by(ChatMessage.created_at).all()
        
        result = []
        for msg in messages:
            msg_dict = ChatMessageSchema.from_orm(msg)
            if msg.sender_type == "admin":
                msg_dict.user_name = "Support"
            elif msg.user_id:
                sender = db.query(User).filter(User.id == msg.user_id).first()
                msg_dict.user_name = sender.name if sender else "Unknown"
            else:
                msg_dict.user_name = "System"
            result.append(msg_dict)
            
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching chat history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.websocket("/{grouped_ride_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    grouped_ride_id: str,
    token: str = Query(...)
):
    from ..core.database import SessionLocal
    
    # Authenticate
    actor = None
    admin_id = verify_admin_token(token)
    if admin_id:
        actor = {"type": "admin", "id": admin_id}
    else:
        verified = verify_token(token)
        if verified:
            user_id_str, _ = verified
            actor = {"type": "user", "id": UUID(user_id_str)}
            
    if not actor:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    if actor["type"] == "user":
        # Verify participation - create session for this check
        db = SessionLocal()
        try:
            is_participant = db.query(RideRequest).filter(
                RideRequest.user_id == actor["id"],
                RideRequest.grouped_ride_id == UUID(grouped_ride_id),
                RideRequest.status.in_(["grouped", "accepted", "assigned", "completed"])
            ).first()
            if not is_participant:
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return
        finally:
            db.close()
            
    await manager.connect(websocket, grouped_ride_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            content = message_data.get("content")
            
            if content:
                # Create a new session for each message
                db = SessionLocal()
                try:
                    new_message = ChatMessage(
                        grouped_ride_id=UUID(grouped_ride_id),
                        content=content,
                        message_type="text",
                        sender_type=actor["type"]
                    )
                    
                    if actor["type"] == "user":
                        new_message.user_id = actor["id"]
                        sender = db.query(User).filter(User.id == actor["id"]).first()
                        sender_name = sender.name if sender else "Unknown"
                    else:
                        new_message.admin_id = UUID(actor["id"]) if isinstance(actor["id"], str) else actor["id"]
                        sender_name = "Support"
                    
                    db.add(new_message)
                    db.commit()
                    db.refresh(new_message)
                    
                    response = {
                        "id": str(new_message.id),
                        "grouped_ride_id": str(new_message.grouped_ride_id),
                        "user_id": str(new_message.user_id) if new_message.user_id else None,
                        "admin_id": str(new_message.admin_id) if new_message.admin_id else None,
                        "content": new_message.content,
                        "message_type": new_message.message_type,
                        "sender_type": new_message.sender_type,
                        "created_at": new_message.created_at.isoformat(),
                        "user_name": sender_name,
                        "notification": {
                            "title": f"New message in group",
                            "body": f"{sender_name}: {content[:50]}{'...' if len(content) > 50 else ''}",
                            "sender_id": str(actor["id"]),
                            "sender_type": actor["type"]
                        }
                    }
                    
                    await manager.broadcast(response, grouped_ride_id)
                finally:
                    db.close()
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, grouped_ride_id)
