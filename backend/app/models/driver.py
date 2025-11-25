from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .base import BaseModel


class Driver(BaseModel):
    __tablename__ = "drivers"

    id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)

    # Status flags
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    deactivated_at = Column(DateTime(timezone=True), nullable=True)

    # Vehicle & license details
    license_number = Column(String(100), nullable=True)
    license_document_url = Column(String(500), nullable=True)
    vehicle_type = Column(String(50), nullable=True)
    vehicle_make = Column(String(100), nullable=True)
    vehicle_model = Column(String(100), nullable=True)
    vehicle_color = Column(String(50), nullable=True)
    vehicle_plate_number = Column(String(50), nullable=True)
    vehicle_document_url = Column(String(500), nullable=True)

    # Metrics
    rating = Column(Float, default=0.0)
    total_trips = Column(Integer, default=0)
    total_ratings = Column(Integer, default=0)

    # Relationships
    user = relationship("User", back_populates="driver_profile")

