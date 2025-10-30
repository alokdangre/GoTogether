from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class UserBase(BaseModel):
    phone: str = Field(..., pattern=r'^\+[1-9]\d{1,14}$', description="Phone number in E.164 format")
    name: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = None


class User(UserBase):
    id: uuid.UUID
    is_active: bool
    is_verified: bool
    rating: float
    total_trips: int
    total_ratings: int
    created_at: datetime
    
    class Config:
        from_attributes = True
