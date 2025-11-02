from datetime import datetime
from typing import Optional
import uuid

from pydantic import BaseModel, Field


class RiderBase(BaseModel):
    preferred_payment_method: Optional[str] = Field(None, max_length=100)


class RiderCreate(RiderBase):
    pass


class RiderUpdate(RiderBase):
    pass


class Rider(RiderBase):
    id: uuid.UUID
    rating: float
    total_trips: int
    total_ratings: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
