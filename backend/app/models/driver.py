from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .base import BaseModel


class Driver(BaseModel):
    __tablename__ = "drivers"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    license_number = Column(String(100), nullable=True, unique=True)
    license_document_url = Column(String(500), nullable=True)
    vehicle_type = Column(String(50), nullable=True)
    vehicle_make = Column(String(100), nullable=True)
    vehicle_model = Column(String(100), nullable=True)
    vehicle_color = Column(String(50), nullable=True)
    vehicle_plate_number = Column(String(50), nullable=True, unique=True)
    vehicle_document_url = Column(String(500), nullable=True)
    is_verified = Column(Boolean, default=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    deactivated_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="driver_profile")
