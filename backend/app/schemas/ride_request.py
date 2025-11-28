from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
import uuid

from .user import User


class RideRequestBase(BaseModel):
    source_lat: float = Field(..., ge=-90, le=90)
    source_lng: float = Field(..., ge=-180, le=180)
    source_address: Optional[str] = Field(None, max_length=500)
    destination_lat: float = Field(..., ge=-90, le=90)
    destination_lng: float = Field(..., ge=-180, le=180)
    destination_address: str = Field(..., max_length=500)
    is_railway_station: bool = False
    train_time: Optional[datetime] = None
    requested_time: datetime
    passenger_count: int = Field(1, ge=1, le=8)
    additional_info: Optional[str] = Field(None, max_length=1000)


class RideRequestCreate(RideRequestBase):
    @validator('requested_time')
    def requested_time_must_be_future(cls, v):
        from datetime import timezone
        now = datetime.now(timezone.utc) if v.tzinfo is not None else datetime.now()
        if v <= now:
            raise ValueError('Requested time must be in the future')
        return v
    
    @validator('train_time')
    def train_time_required_for_station(cls, v, values):
        if values.get('is_railway_station') and not v:
            raise ValueError('Train time is required for railway station destinations')
        return v


class RideRequest(RideRequestBase):
    id: uuid.UUID
    user_id: uuid.UUID
    status: str
    grouped_ride_id: Optional[uuid.UUID]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class RideRequestWithUser(RideRequest):
    user: User


class RideRequestUpdate(BaseModel):
    status: Optional[str] = None
    grouped_ride_id: Optional[uuid.UUID] = None
