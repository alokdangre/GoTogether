from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

from .user import User


class RatingItem(BaseModel):
    user_id: uuid.UUID
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=500)


class RatingCreate(BaseModel):
    ratings: List[RatingItem]


class Rating(BaseModel):
    id: uuid.UUID
    trip_id: uuid.UUID
    rater_id: uuid.UUID
    rated_user_id: uuid.UUID
    rating: int
    comment: Optional[str]
    created_at: datetime
    rater: User
    rated_user: User
    
    class Config:
        from_attributes = True
