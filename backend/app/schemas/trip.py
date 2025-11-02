from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid

from .user import User


class VehicleType(str, Enum):
    CAR = "car"
    AUTO = "auto"
    BIKE = "bike"


class TripStatus(str, Enum):
    ACTIVE = "active"
    FULL = "full"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class MemberStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"


class TripBase(BaseModel):
    origin_lat: float = Field(..., ge=-90, le=90)
    origin_lng: float = Field(..., ge=-180, le=180)
    origin_address: Optional[str] = Field(None, max_length=500)
    dest_lat: float = Field(..., ge=-90, le=90)
    dest_lng: float = Field(..., ge=-180, le=180)
    dest_address: Optional[str] = Field(None, max_length=500)
    departure_time: datetime
    total_seats: int = Field(..., ge=1, le=8)
    fare_per_person: float = Field(..., gt=0)
    vehicle_type: VehicleType
    description: Optional[str] = Field(None, max_length=500)


class TripCreate(TripBase):
    @validator('departure_time')
    def departure_time_must_be_future(cls, v):
        if v <= datetime.now():
            raise ValueError('Departure time must be in the future')
        return v


class TripUpdate(BaseModel):
    departure_time: Optional[datetime] = None
    total_seats: Optional[int] = Field(None, ge=1, le=8)
    fare_per_person: Optional[float] = Field(None, gt=0)
    description: Optional[str] = Field(None, max_length=500)
    status: Optional[TripStatus] = None


class TripMemberBase(BaseModel):
    seats_requested: int = Field(1, ge=1, le=4)
    message: Optional[str] = Field(None, max_length=500)


class TripMemberCreate(TripMemberBase):
    pass


class TripMember(TripMemberBase):
    id: uuid.UUID
    trip_id: uuid.UUID
    user_id: uuid.UUID
    user: User
    status: MemberStatus
    joined_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class Trip(TripBase):
    id: uuid.UUID
    driver_id: uuid.UUID
    status: TripStatus
    available_seats: int
    origin_geohash: str
    dest_geohash: str
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class TripWithDriver(Trip):
    driver: User


class TripDetail(TripWithDriver):
    members: List[TripMember] = []


class TripSearch(BaseModel):
    origin_lat: float = Field(..., ge=-90, le=90)
    origin_lng: float = Field(..., ge=-180, le=180)
    dest_lat: float = Field(..., ge=-90, le=90)
    dest_lng: float = Field(..., ge=-180, le=180)
    departure_time: datetime
    max_origin_distance: float = Field(2.0, gt=0, le=10)
    max_dest_distance: float = Field(3.0, gt=0, le=10)
    time_window_minutes: int = Field(15, gt=0, le=120)


class TripMatch(TripWithDriver):
    origin_distance: float
    dest_distance: float
    time_difference_minutes: int
    match_score: float
