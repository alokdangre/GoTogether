from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from uuid import UUID
import json
from datetime import datetime

from ..core.database import get_db
from ..core.auth import verify_token, get_current_user
from ..models.chat import ChatMessage
from ..models.grouped_ride import GroupedRide
from ..models.ride_request import RideRequest
from ..models.user import User
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify user is part of the ride
    is_participant = db.query(RideRequest).filter(
        RideRequest.user_id == current_user.id,
        RideRequest.grouped_ride_id == grouped_ride_id,
        RideRequest.status.in_(["accepted", "assigned", "completed"])
    ).first()
    
    if not is_participant:
        # Check if user is the driver? (Not implemented yet)
        # Check if user is admin? (Not implemented yet)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a participant of this ride"
        )
         
    messages = db.query(ChatMessage).filter(
        ChatMessage.grouped_ride_id == grouped_ride_id
    ).order_by(ChatMessage.created_at).all()
    
    # Populate user_name
    result = []
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.user_id).first()
        msg_dict = ChatMessageSchema.from_orm(msg)
        msg_dict.user_name = sender.name if sender else "Unknown"
        result.append(msg_dict)
        
    return result

@router.websocket("/{grouped_ride_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    grouped_ride_id: str,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    # Authenticate
    user_id_str, _ = verify_token(token)
    if not user_id_str:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    user_id = UUID(user_id_str)
    
    # Verify participation
    is_participant = db.query(RideRequest).filter(
        RideRequest.user_id == user_id,
        RideRequest.grouped_ride_id == UUID(grouped_ride_id),
        RideRequest.status.in_(["accepted", "assigned", "completed"])
    ).first()
    
    if not is_participant:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    await manager.connect(websocket, grouped_ride_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            content = message_data.get("content")
            
            if content:
                # Save to DB
                new_message = ChatMessage(
                    grouped_ride_id=UUID(grouped_ride_id),
                    user_id=user_id,
                    content=content,
                    message_type="text"
                )
                db.add(new_message)
                db.commit()
                db.refresh(new_message)
                
                # Get sender name
                sender = db.query(User).filter(User.id == user_id).first()
                sender_name = sender.name if sender else "Unknown"
                
                # Broadcast
                response = {
                    "id": str(new_message.id),
                    "grouped_ride_id": str(new_message.grouped_ride_id),
                    "user_id": str(new_message.user_id),
                    "content": new_message.content,
                    "message_type": new_message.message_type,
                    "created_at": new_message.created_at.isoformat(),
                    "user_name": sender_name
                }
                
                await manager.broadcast(response, grouped_ride_id)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, grouped_ride_id)
