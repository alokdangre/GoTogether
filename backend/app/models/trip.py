from sqlalchemy import Column, String, Float, Integer, DateTime, Text, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum

from .base import BaseModel
from .user import User


class TripStatus(PyEnum):
    ACTIVE = "active"
    FULL = "full"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class VehicleType(PyEnum):
    CAR = "car"
    AUTO = "auto"
    BIKE = "bike"


class MemberStatus(PyEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"


class Trip(BaseModel):
    __tablename__ = "trips"
    
    # Driver (references users.id)
    driver_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Route
    origin_lat = Column(Float, nullable=False)
    origin_lng = Column(Float, nullable=False)
    origin_address = Column(String(500), nullable=True)
    origin_geohash = Column(String(12), index=True, nullable=False)  # For fast matching
    
    dest_lat = Column(Float, nullable=False)
    dest_lng = Column(Float, nullable=False)
    dest_address = Column(String(500), nullable=True)
    dest_geohash = Column(String(12), index=True, nullable=False)  # For fast matching
    
    # Trip details
    departure_time = Column(DateTime(timezone=True), nullable=False, index=True)
    total_seats = Column(Integer, nullable=False)
    available_seats = Column(Integer, nullable=False)
    fare_per_person = Column(Float, nullable=False)
    vehicle_type = Column(Enum(VehicleType), nullable=False)
    description = Column(Text, nullable=True)
    
    # Status
    status = Column(Enum(TripStatus), default=TripStatus.ACTIVE, index=True)
    
    # Relationships
    driver = relationship("User", foreign_keys=[driver_id])
    members = relationship("TripMember", back_populates="trip", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="trip", uselist=False)
    ratings = relationship("Rating", back_populates="trip", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="trip", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Trip(id={self.id}, driver_id={self.driver_id}, status={self.status})>"


class TripMember(BaseModel):
    __tablename__ = "trip_members"
    
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    seats_requested = Column(Integer, nullable=False, default=1)
    status = Column(Enum(MemberStatus), default=MemberStatus.PENDING)
    message = Column(Text, nullable=True)
    
    # Relationships
    trip = relationship("Trip", back_populates="members")
    user = relationship("User", back_populates="trip_memberships")
    
    def __repr__(self):
        return f"<TripMember(trip_id={self.trip_id}, user_id={self.user_id}, status={self.status})>"
