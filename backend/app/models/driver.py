from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .base import BaseModel


class Driver(BaseModel):
    __tablename__ = "drivers"
    
    # Driver is not linked to user anymore - standalone entity managed by admin
    name = Column(String(100), nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=True)
    
    # Driver details
    license_number = Column(String(50), unique=True, nullable=True)
    license_document_url = Column(String(500), nullable=True)
    vehicle_type = Column(String(20), nullable=True)
    vehicle_make = Column(String(100), nullable=True)
    vehicle_model = Column(String(100), nullable=True)
    vehicle_color = Column(String(50), nullable=True)
    vehicle_plate_number = Column(String(20), unique=True, nullable=True)
    vehicle_document_url = Column(String(500), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    availability_status = Column(String(20), default="available")  # available, busy, offline
    verified_at = Column(DateTime(timezone=True), nullable=True)
    deactivated_at = Column(DateTime(timezone=True), nullable=True)
    
    # Statistics
    rating = Column(Float, default=0.0)
    total_rides = Column(Integer, default=0)
    assigned_rides_count = Column(Integer, default=0)
    total_ratings = Column(Integer, default=0)
    
    # Relationships
    grouped_rides = relationship("GroupedRide", back_populates="driver")
    ratings = relationship("Rating", back_populates="driver")
    
    def __repr__(self):
        return f"<Driver(id={self.id}, name={self.name}, phone={self.phone})>"
