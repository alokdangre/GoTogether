from datetime import datetime
from typing import Optional
import uuid

from pydantic import BaseModel, Field, EmailStr


class DriverBase(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = Field(None, max_length=500)
    license_number: Optional[str] = Field(None, max_length=100)
    license_document_url: Optional[str] = Field(None, max_length=500)
    vehicle_type: Optional[str] = Field(None, max_length=50)
    vehicle_make: Optional[str] = Field(None, max_length=100)
    vehicle_model: Optional[str] = Field(None, max_length=100)
    vehicle_color: Optional[str] = Field(None, max_length=50)
    vehicle_plate_number: Optional[str] = Field(None, max_length=50)
    vehicle_document_url: Optional[str] = Field(None, max_length=500)


class DriverCreate(DriverBase):
    phone: str = Field(..., pattern=r'^\+[1-9]\d{1,14}$')
    email: Optional[EmailStr] = None
    password: str = Field(..., min_length=8, max_length=128)
    license_number: str = Field(..., max_length=100)
    vehicle_plate_number: str = Field(..., max_length=50)


class DriverUpdate(DriverBase):
    phone: Optional[str] = Field(None, pattern=r'^\+[1-9]\d{1,14}$')
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8, max_length=128)
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None


class Driver(DriverBase):
    id: uuid.UUID
    phone: str
    email: Optional[str]
    is_active: bool
    is_verified: bool
    verified_at: Optional[datetime]
    deactivated_at: Optional[datetime]
    rating: float
    total_trips: int
    total_ratings: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class DriverLoginRequest(BaseModel):
    phone: Optional[str] = Field(None, pattern=r'^\+[1-9]\d{1,14}$')
    email: Optional[EmailStr] = None
    password: str = Field(..., min_length=8, max_length=128)


class DriverToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    driver: Driver
