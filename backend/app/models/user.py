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
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_phone_verified = Column(Boolean, default=False)
    is_email_verified = Column(Boolean, default=False)
    
    # Computed fields (updated by triggers/background jobs)
    rating = Column(Float, default=0.0)
    total_trips = Column(Integer, default=0)
    total_ratings = Column(Integer, default=0)
    
    # Relationships
    created_trips = relationship("Trip", back_populates="driver", foreign_keys="Trip.driver_id")
    trip_memberships = relationship("TripMember", back_populates="user")
    sent_ratings = relationship("Rating", back_populates="rater", foreign_keys="Rating.rater_id")
    received_ratings = relationship("Rating", back_populates="rated_user", foreign_keys="Rating.rated_user_id")
    chat_messages = relationship("ChatMessage", back_populates="user")
    
    def __repr__(self):
        return f"<User(phone={self.phone}, name={self.name})>"
