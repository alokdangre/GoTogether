from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

from .driver import Driver as DriverSchema


class UserBase(BaseModel):
    phone: str = Field(..., pattern=r'^\+[1-9]\d{1,14}$', description="Phone number in E.164 format")
    email: Optional[str] = Field(None, max_length=255)
    name: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    password: Optional[str] = Field(None, min_length=8, max_length=128)


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8, max_length=128)


class User(UserBase):
    id: uuid.UUID
    is_active: bool
    is_verified: bool
    is_phone_verified: bool
    is_email_verified: bool
    rating: float
    total_trips: int
    total_ratings: int
    created_at: datetime
    driver_profile: Optional[DriverSchema] = None
    
    class Config:
        from_attributes = True
