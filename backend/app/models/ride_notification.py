from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from .base import BaseModel


class RideNotification(BaseModel):
    __tablename__ = "ride_notifications"
    
    # User receiving the notification
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Grouped ride this notification is about
    grouped_ride_id = Column(UUID(as_uuid=True), ForeignKey("grouped_rides.id"), nullable=False)
    
    # Notification type: ride_assignment, ride_completed
    notification_type = Column(String(50), nullable=False)
    
    # Status: pending, accepted, rejected, read
    status = Column(String(20), default="pending", index=True)
    
    # Timestamps
    sent_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    responded_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="notifications")
    grouped_ride = relationship("GroupedRide", back_populates="notifications")
    
    def __repr__(self):
        return f"<RideNotification(id={self.id}, user_id={self.user_id}, type={self.notification_type}, status={self.status})>"
