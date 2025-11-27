from sqlalchemy import Column, String, Float, Integer, Boolean
from sqlalchemy.orm import relationship

from .base import BaseModel


class User(BaseModel):
    __tablename__ = "users"
    
    phone = Column(String(20), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=True)
    name = Column(String(100), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    whatsapp_number = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_phone_verified = Column(Boolean, default=False)
    is_email_verified = Column(Boolean, default=False)
    
    # Ride statistics
    total_rides = Column(Integer, default=0)
    total_savings = Column(Float, default=0.0)
    
    # Rating (average from all rides)
    rating = Column(Float, default=0.0)
    total_ratings = Column(Integer, default=0)
    
    # Relationships
    ride_requests = relationship("RideRequest", back_populates="user")
    notifications = relationship("RideNotification", back_populates="user")
    ratings = relationship("Rating", back_populates="user")
    
    def __repr__(self):
        return f"<User(phone={self.phone}, name={self.name})>"
