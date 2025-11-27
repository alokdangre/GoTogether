from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from .base import BaseModel


class RideRequest(BaseModel):
    __tablename__ = "ride_requests"
    
    # User who requested the ride
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Source location
    source_lat = Column(Float, nullable=False)
    source_lng = Column(Float, nullable=False)
    source_address = Column(String(500), nullable=True)
    
    # Destination location
    destination_lat = Column(Float, nullable=False)
    destination_lng = Column(Float, nullable=False)
    destination_address = Column(String(500), nullable=False)
    
    # Railway station specific
    is_railway_station = Column(Boolean, default=False)
    train_time = Column(DateTime(timezone=True), nullable=True)
    
    # Request details
    requested_time = Column(DateTime(timezone=True), nullable=False)
    passenger_count = Column(Integer, default=1, nullable=False)
    additional_info = Column(Text, nullable=True)
    
    # Status: pending, grouped, assigned, accepted, rejected, completed, cancelled
    status = Column(String(20), default="pending", index=True)
    
    # Link to grouped ride (if assigned)
    grouped_ride_id = Column(UUID(as_uuid=True), ForeignKey("grouped_rides.id"), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="ride_requests")
    grouped_ride = relationship("GroupedRide", back_populates="ride_requests")
    
    def __repr__(self):
        return f"<RideRequest(id={self.id}, user_id={self.user_id}, status={self.status})>"
