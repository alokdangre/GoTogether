from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class NotificationBase(BaseModel):
    notification_type: str
    status: str = "pending"


class Notification(NotificationBase):
    id: uuid.UUID
    user_id: uuid.UUID
    grouped_ride_id: uuid.UUID
    sent_at: datetime
    responded_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class NotificationWithDetails(Notification):
    from .grouped_ride import GroupedRide
    grouped_ride: GroupedRide


class NotificationResponse(BaseModel):
    action: str  # "accept" or "reject"
