from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional, Tuple

from ..core.database import get_db
from ..core.auth import get_current_user_with_role
from ..models.user import User
from ..models.trip import Trip, TripMember, MemberStatus
from ..models.rating import Rating, RatingParticipantType
from ..schemas.rating import RatingCreate, RatingTargetType

router = APIRouter(prefix="/api/trips", tags=["Ratings"])


@router.post("/{trip_id}/rate", status_code=status.HTTP_201_CREATED)
async def rate_trip_participants(
    trip_id: str,
    rating_data: RatingCreate,
    current_identity: Tuple[User, str] = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Rate trip participants after trip completion"""
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    
    actor, role_claim = current_identity

    # Check if rater was part of this trip
    is_driver = trip.driver_id == actor.id
    is_rider_member = db.query(TripMember).filter(
        and_(
            TripMember.trip_id == trip.id,
            TripMember.user_id == actor.id,
            TripMember.status == MemberStatus.APPROVED
        )
    ).first() is not None

    if not (is_driver or is_rider_member):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to rate participants of this trip"
        )
    
    # Create ratings
    created_ratings = []
    for rating_item in rating_data.ratings:
        # Determine target entity
        target_user: Optional[User] = None
        target_role: Optional[RatingParticipantType] = None

        if rating_item.target_type == RatingTargetType.USER:
            target_user = db.query(User).filter(User.id == rating_item.target_id).first()
            if not target_user:
                continue

            # Verify target user was part of trip
            is_target_member = db.query(TripMember).filter(
                and_(
                    TripMember.trip_id == trip.id,
                    TripMember.user_id == target_user.id,
                    TripMember.status == MemberStatus.APPROVED
                )
            ).first() is not None
            if not is_target_member:
                continue

            # Prevent self-rating for riders
            if target_user.id == actor.id:
                continue

            target_role = RatingParticipantType.RIDER

        elif rating_item.target_type == RatingTargetType.DRIVER:
            target_user = db.query(User).filter(User.id == rating_item.target_id).first()
            if not target_user:
                continue

            if trip.driver_id != target_user.id:
                continue

            if target_user.id == actor.id:
                continue

            target_role = RatingParticipantType.DRIVER

        if not target_user or not target_role:
            continue

        # Check for existing rating
        rating_query = db.query(Rating).filter(Rating.trip_id == trip.id)

        rating_query = rating_query.filter(Rating.rater_id == actor.id, Rating.rated_id == target_user.id)

        if rating_query.first():
            continue

        # Create rating
        rating = Rating(
            trip_id=trip.id,
            rating=rating_item.rating,
            comment=rating_item.comment,
            rater_id=actor.id,
            rated_id=target_user.id,
            rater_role=RatingParticipantType.DRIVER if is_driver else RatingParticipantType.RIDER,
            rated_role=target_role,
        )

        db.add(rating)
        created_ratings.append(rating)
    
    db.commit()
    
    # Update user ratings (this would typically be done by a background job)
    for rating in created_ratings:
        rated_user = db.query(User).filter(User.id == rating.rated_id).first()
        if rated_user:
            all_ratings = db.query(Rating).filter(Rating.rated_id == rated_user.id).all()
            if all_ratings:
                total_rating = sum(r.rating for r in all_ratings)
                rated_user.rating = total_rating / len(all_ratings)
                rated_user.total_ratings = len(all_ratings)
    
    db.commit()
    
    return {"message": f"Successfully rated {len(created_ratings)} participants"}
