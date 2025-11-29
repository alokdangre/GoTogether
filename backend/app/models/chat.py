from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel


class ChatMessage(BaseModel):
    __tablename__ = "chat_messages"
    
    grouped_ride_id = Column(UUID(as_uuid=True), ForeignKey("grouped_rides.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    admin_id = Column(UUID(as_uuid=True), ForeignKey("admins.id"), nullable=True)
    content = Column(Text, nullable=False)
    message_type = Column(String(20), default="text")  # text, location, system
    sender_type = Column(String(20), default="user")  # user, admin
    
    # Relationships
    grouped_ride = relationship("GroupedRide", back_populates="chat_messages")
    user = relationship("User")
    admin = relationship("Admin")
    
    def __repr__(self):
        return f"<ChatMessage(grouped_ride_id={self.grouped_ride_id}, user_id={self.user_id})>"
