from sqlalchemy import Column, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .base import BaseModel


class Rider(BaseModel):
    __tablename__ = "riders"

    id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)

    preferred_payment_method = Column(String(100), nullable=True)
    rating = Column(Float, default=0.0)
    total_trips = Column(Integer, default=0)
    total_ratings = Column(Integer, default=0)

    user = relationship("User", back_populates="rider_profile")
