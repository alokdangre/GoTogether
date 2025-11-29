from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class ChatMessageCreate(BaseModel):
    content: str
    message_type: str = "text"

class ChatMessage(BaseModel):
    id: UUID
    grouped_ride_id: UUID
    user_id: Optional[UUID]
    admin_id: Optional[UUID]
    content: str
    message_type: str
    sender_type: str
    created_at: datetime
    user_name: Optional[str] = None

    class Config:
        from_attributes = True
