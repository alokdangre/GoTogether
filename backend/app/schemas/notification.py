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


from .driver import Driver
from .grouped_ride import GroupedRide

class GroupedRideWithDriver(GroupedRide):
    driver: Optional[Driver] = None

class NotificationWithDetails(Notification):
    grouped_ride: GroupedRideWithDriver

class NotificationResponse(BaseModel):
    action: str  # "accept" or "reject"
