from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class DriverBase(BaseModel):
    name: str = Field(..., max_length=100)
    phone: str = Field(..., max_length=20)
    email: Optional[str] = Field(None, max_length=255)
    license_number: Optional[str] = Field(None, max_length=50)
    vehicle_type: Optional[str] = Field(None, max_length=20)
    vehicle_make: Optional[str] = Field(None, max_length=100)
    vehicle_model: Optional[str] = Field(None, max_length=100)
    vehicle_color: Optional[str] = Field(None, max_length=50)
    vehicle_plate_number: Optional[str] = Field(None, max_length=20)
    availability_status: str = "available"


class DriverCreate(DriverBase):
    pass


class DriverUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    license_number: Optional[str] = None
    vehicle_type: Optional[str] = None
    vehicle_make: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_color: Optional[str] = None
    vehicle_plate_number: Optional[str] = None
    availability_status: Optional[str] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None


class Driver(DriverBase):
    id: uuid.UUID
    is_active: bool
    is_verified: bool
    rating: float
    total_rides: int
    assigned_rides_count: int
    total_ratings: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True
