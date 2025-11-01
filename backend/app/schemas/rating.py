from datetime import datetime
from enum import Enum
from typing import List, Optional
import uuid

from pydantic import BaseModel, Field

from .user import User
from .driver import Driver


class RatingTargetType(str, Enum):
    USER = "user"
    DRIVER = "driver"


class RatingItem(BaseModel):
    target_type: RatingTargetType
    target_id: uuid.UUID
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=500)


class RatingCreate(BaseModel):
    ratings: List[RatingItem]


class Rating(BaseModel):
    id: uuid.UUID
    trip_id: uuid.UUID
    rating: int
    comment: Optional[str]
    created_at: datetime
    rater_user: Optional[User] = None
    rater_driver: Optional[Driver] = None
    rated_user: Optional[User] = None
    rated_driver: Optional[Driver] = None

    class Config:
        from_attributes = True
