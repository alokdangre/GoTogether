from sqlalchemy import Column, Integer, Text, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .base import BaseModel


class Rating(BaseModel):
    __tablename__ = "ratings"

    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id"), nullable=False)
    rater_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    rated_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5 stars
    comment = Column(Text, nullable=True)

    # Relationships
    trip = relationship("Trip", back_populates="ratings")
    rater = relationship("User", back_populates="sent_ratings", foreign_keys=[rater_id])
    rated = relationship("User", back_populates="received_ratings", foreign_keys=[rated_id])

    __table_args__ = (
        UniqueConstraint(
            'trip_id',
            'rater_id',
            'rated_id',
            name='unique_trip_rating'
        ),
    )

    def __repr__(self):
        return (
            f"<Rating(trip_id={self.trip_id}, rater_user_id={self.rater_user_id}, "
            f"rater_driver_id={self.rater_driver_id}, rating={self.rating})>"
        )
