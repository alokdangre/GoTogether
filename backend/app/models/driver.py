from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String
from sqlalchemy.orm import relationship

from .base import BaseModel


class Driver(BaseModel):
    __tablename__ = "drivers"

    # Auth & contact
    phone = Column(String(20), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(100), nullable=True)
    avatar_url = Column(String(500), nullable=True)

    # Status flags
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    deactivated_at = Column(DateTime(timezone=True), nullable=True)

    # Vehicle & license details
    license_number = Column(String(100), unique=True, nullable=True)
    license_document_url = Column(String(500), nullable=True)
    vehicle_type = Column(String(50), nullable=True)
    vehicle_make = Column(String(100), nullable=True)
    vehicle_model = Column(String(100), nullable=True)
    vehicle_color = Column(String(50), nullable=True)
    vehicle_plate_number = Column(String(50), unique=True, nullable=True)
    vehicle_document_url = Column(String(500), nullable=True)

    # Metrics
    rating = Column(Float, default=0.0)
    total_trips = Column(Integer, default=0)
    total_ratings = Column(Integer, default=0)

    # Relationships
    trips = relationship("Trip", back_populates="driver")
