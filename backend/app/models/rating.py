from sqlalchemy import Column, String, Float, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .base import BaseModel


class Rating(BaseModel):
    __tablename__ = "ratings"
    
    # User giving the rating
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Driver being rated
    driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.id"), nullable=False)
    
    # Grouped ride this rating is for
    grouped_ride_id = Column(UUID(as_uuid=True), ForeignKey("grouped_rides.id"), nullable=False)
    
    # Rating details
    rating = Column(Integer, nullable=False)  # 1-5 stars
    comment = Column(Text, nullable=True)
    testimonial_text = Column(Text, nullable=True)  # Generated testimonial for WhatsApp
    
    # Relationships
    user = relationship("User", back_populates="ratings_given")
    driver = relationship("Driver", back_populates="ratings")
    grouped_ride = relationship("GroupedRide", back_populates="ratings")
    
    def __repr__(self):
        return f"<Rating(id={self.id}, user_id={self.user_id}, driver_id={self.driver_id}, rating={self.rating})>"
