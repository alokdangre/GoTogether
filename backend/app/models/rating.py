from sqlalchemy import Column, Integer, Text, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .base import BaseModel


class Rating(BaseModel):
    __tablename__ = "ratings"

    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id"), nullable=False)
    rater_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    rater_driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.id"), nullable=True)
    rated_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    rated_driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.id"), nullable=True)
    rating = Column(Integer, nullable=False)  # 1-5 stars
    comment = Column(Text, nullable=True)

    # Relationships
    trip = relationship("Trip", back_populates="ratings")
    rater_user = relationship("User", back_populates="sent_ratings", foreign_keys=[rater_user_id])
    rated_user = relationship("User", back_populates="received_ratings", foreign_keys=[rated_user_id])
    rater_driver = relationship("Driver", back_populates="sent_ratings", foreign_keys=[rater_driver_id])
    rated_driver = relationship("Driver", back_populates="received_ratings", foreign_keys=[rated_driver_id])

    __table_args__ = (
        UniqueConstraint(
            'trip_id',
            'rater_user_id',
            'rater_driver_id',
            'rated_user_id',
            'rated_driver_id',
            name='unique_trip_rating'
        ),
    )

    def __repr__(self):
        return (
            f"<Rating(trip_id={self.trip_id}, rater_user_id={self.rater_user_id}, "
            f"rater_driver_id={self.rater_driver_id}, rating={self.rating})>"
        )
