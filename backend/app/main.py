from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
import json
import uuid
from datetime import datetime
from typing import Dict, List

from .core.config import settings
from .core.database import get_db
from .core.redis import get_redis, close_redis
from .models.chat import ChatMessage
from .models.trip import Trip, TripMember, MemberStatus
from .models.user import User
from .routes import (
    auth_router,
    drivers_router,
    trips_router,
    payment_router,
    ratings_router,
    admin_router,
    analytics_router,
)

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    debug=settings.debug,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(drivers_router)
app.include_router(trips_router)
app.include_router(payment_router)
app.include_router(ratings_router)
app.include_router(admin_router)
app.include_router(analytics_router)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, trip_id: str):
        await websocket.accept()
        if trip_id not in self.active_connections:
            self.active_connections[trip_id] = []
        self.active_connections[trip_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, trip_id: str):
        if trip_id in self.active_connections:
            self.active_connections[trip_id].remove(websocket)
            if not self.active_connections[trip_id]:
                del self.active_connections[trip_id]
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)
    
    async def broadcast_to_trip(self, message: str, trip_id: str):
        if trip_id in self.active_connections:
            for connection in self.active_connections[trip_id]:
                try:
                    await connection.send_text(message)
                except:
                    # Remove broken connections
                    self.active_connections[trip_id].remove(connection)

manager = ConnectionManager()

@app.websocket("/ws/trips/{trip_id}/chat")
async def websocket_endpoint(
    websocket: WebSocket, 
    trip_id: str,
    token: str,
    db: Session = Depends(get_db)
):
    """WebSocket endpoint for trip chat"""
    # Verify token and get user (simplified for demo)
    from .core.auth import verify_token
    verified = verify_token(token)
    if not verified:
        await websocket.close(code=1008, reason="Invalid token")
        return
    
    user_id, _role = verified
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        await websocket.close(code=1008, reason="User not found")
        return
    
    # Verify user is part of the trip
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        await websocket.close(code=1008, reason="Trip not found")
        return
    
    is_driver = trip.driver_id == user.id
    is_member = db.query(TripMember).filter(
        TripMember.trip_id == trip_id,
        TripMember.user_id == user.id,
        TripMember.status == MemberStatus.APPROVED
    ).first() is not None
    
    if not (is_driver or is_member):
        await websocket.close(code=1008, reason="Not authorized for this trip")
        return
    
    await manager.connect(websocket, trip_id)
    
    # Send recent messages (last 100)
    recent_messages = db.query(ChatMessage).filter(
        ChatMessage.trip_id == trip_id
    ).order_by(ChatMessage.created_at.desc()).limit(100).all()
    
    for msg in reversed(recent_messages):
        message_data = {
            "type": "message",
            "id": str(msg.id),
            "user_id": str(msg.user_id),
            "user_name": msg.user.name or "Anonymous",
            "content": msg.content,
            "timestamp": msg.created_at.isoformat()
        }
        await manager.send_personal_message(json.dumps(message_data), websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data["type"] == "message":
                # Save message to database
                chat_message = ChatMessage(
                    trip_id=trip_id,
                    user_id=user.id,
                    content=message_data["content"],
                    message_type="text"
                )
                db.add(chat_message)
                db.commit()
                db.refresh(chat_message)
                
                # Broadcast to all trip participants
                broadcast_data = {
                    "type": "message",
                    "id": str(chat_message.id),
                    "user_id": str(user.id),
                    "user_name": user.name or "Anonymous",
                    "content": message_data["content"],
                    "timestamp": chat_message.created_at.isoformat()
                }
                await manager.broadcast_to_trip(json.dumps(broadcast_data), trip_id)
            
            elif message_data["type"] == "location_update":
                # Broadcast location update
                broadcast_data = {
                    "type": "location_update",
                    "user_id": str(user.id),
                    "user_name": user.name or "Anonymous",
                    "lat": message_data["lat"],
                    "lng": message_data["lng"],
                    "timestamp": datetime.utcnow().isoformat()
                }
                await manager.broadcast_to_trip(json.dumps(broadcast_data), trip_id)
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, trip_id)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "GoTogether API is running", "version": settings.version}

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "version": settings.version,
        "timestamp": datetime.utcnow().isoformat()
    }

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    print(f"Starting {settings.app_name} v{settings.version}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    await close_redis()
    print("Shutting down GoTogether API")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )
