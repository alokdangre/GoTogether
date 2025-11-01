from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Tuple, Union

from ..core.database import get_db
from ..core.auth import get_current_identity
from ..models.user import User
from ..models.driver import Driver
from ..models.trip import Trip, TripMember, MemberStatus
from ..models.rating import Rating
from ..schemas.rating import RatingCreate, RatingTargetType

router = APIRouter(prefix="/api/trips", tags=["Ratings"])


@router.post("/{trip_id}/rate", status_code=status.HTTP_201_CREATED)
async def rate_trip_participants(
    trip_id: str,
    rating_data: RatingCreate,
    current_identity: Tuple[str, Union[User, Driver]] = Depends(get_current_identity),
    db: Session = Depends(get_db)
):
    """Rate trip participants after trip completion"""
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    
    actor_type, actor = current_identity

    # Check if rater was part of this trip
    if actor_type == "driver":
        is_participant = trip.driver_id == actor.id
    else:
        is_participant = db.query(TripMember).filter(
            and_(
                TripMember.trip_id == trip.id,
                TripMember.user_id == actor.id,
                TripMember.status == MemberStatus.APPROVED
            )
        ).first() is not None

    if not is_participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to rate participants of this trip"
        )
    
    # Create ratings
    created_ratings = []
    for rating_item in rating_data.ratings:
        # Determine target entity
        target_user = None
        target_driver = None

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
            if actor_type == "user" and target_user.id == actor.id:
                continue

        elif rating_item.target_type == RatingTargetType.DRIVER:
            target_driver = db.query(Driver).filter(Driver.id == rating_item.target_id).first()
            if not target_driver:
                continue

            if trip.driver_id != target_driver.id:
                continue

            if actor_type == "driver" and target_driver.id == actor.id:
                continue

        else:
            continue

        # Check for existing rating
        rating_query = db.query(Rating).filter(Rating.trip_id == trip.id)

        if actor_type == "user":
            rating_query = rating_query.filter(Rating.rater_user_id == actor.id)
        else:
            rating_query = rating_query.filter(Rating.rater_driver_id == actor.id)

        if target_user:
            rating_query = rating_query.filter(Rating.rated_user_id == target_user.id)
        if target_driver:
            rating_query = rating_query.filter(Rating.rated_driver_id == target_driver.id)

        if rating_query.first():
            continue

        # Create rating
        rating = Rating(
            trip_id=trip.id,
            rating=rating_item.rating,
            comment=rating_item.comment
        )

        if actor_type == "user":
            rating.rater_user_id = actor.id
        else:
            rating.rater_driver_id = actor.id

        if target_user:
            rating.rated_user_id = target_user.id
        if target_driver:
            rating.rated_driver_id = target_driver.id

        db.add(rating)
        created_ratings.append(rating)
    
    db.commit()
    
    # Update user ratings (this would typically be done by a background job)
    for rating in created_ratings:
        if rating.rated_user_id:
            rated_user = db.query(User).filter(User.id == rating.rated_user_id).first()
            if rated_user:
                all_ratings = db.query(Rating).filter(Rating.rated_user_id == rated_user.id).all()
                if all_ratings:
                    total_rating = sum(r.rating for r in all_ratings)
                    rated_user.rating = total_rating / len(all_ratings)
                    rated_user.total_ratings = len(all_ratings)

        if rating.rated_driver_id:
            rated_driver = db.query(Driver).filter(Driver.id == rating.rated_driver_id).first()
            if rated_driver:
                all_ratings = db.query(Rating).filter(Rating.rated_driver_id == rated_driver.id).all()
                if all_ratings:
                    total_rating = sum(r.rating for r in all_ratings)
                    rated_driver.rating = total_rating / len(all_ratings)
                    rated_driver.total_ratings = len(all_ratings)
    
    db.commit()
    
    return {"message": f"Successfully rated {len(created_ratings)} participants"}
