from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .base import BaseModel


class GroupedRide(BaseModel):
    __tablename__ = "grouped_rides"
    
    # Admin who created the group
    admin_id = Column(UUID(as_uuid=True), ForeignKey("admins.id"), nullable=False)
    
    # Assigned driver
    driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.id"), nullable=True)
    
    # Ride details
    destination_address = Column(String(500), nullable=False)
    pickup_time = Column(DateTime(timezone=True), nullable=True)
    pickup_location = Column(String(500), nullable=True)
    
    # Pricing for savings calculation
    actual_price = Column(Float, nullable=True)  # What it would normally cost
    charged_price = Column(Float, nullable=True)  # What users are charged
    
    # Status: pending_acceptance, confirmed, in_progress, completed, cancelled
    status = Column(String(20), default="pending_acceptance", index=True)
    
    # Relationships
    admin = relationship("Admin", back_populates="grouped_rides")
    driver = relationship("Driver", back_populates="grouped_rides")
    ride_requests = relationship("RideRequest", back_populates="grouped_ride")
    notifications = relationship("RideNotification", back_populates="grouped_ride", cascade="all, delete-orphan")
    ratings = relationship("Rating", back_populates="grouped_ride", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<GroupedRide(id={self.id}, driver_id={self.driver_id}, status={self.status})>"
