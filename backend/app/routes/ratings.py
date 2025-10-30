from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..core.database import get_db
from ..core.auth import get_current_user
from ..models.user import User
from ..models.trip import Trip, TripMember, MemberStatus
from ..models.rating import Rating
from ..schemas.rating import RatingCreate

router = APIRouter(prefix="/api/trips", tags=["Ratings"])


@router.post("/{trip_id}/rate", status_code=status.HTTP_201_CREATED)
async def rate_trip_participants(
    trip_id: str,
    rating_data: RatingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rate trip participants after trip completion"""
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    
    # Check if user was part of this trip (driver or approved member)
    is_driver = trip.driver_id == current_user.id
    is_member = db.query(TripMember).filter(
        and_(
            TripMember.trip_id == trip.id,
            TripMember.user_id == current_user.id,
            TripMember.status == MemberStatus.APPROVED
        )
    ).first() is not None
    
    if not (is_driver or is_member):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to rate participants of this trip"
        )
    
    # Create ratings
    created_ratings = []
    for rating_item in rating_data.ratings:
        # Check if user being rated was part of the trip
        if rating_item.user_id == current_user.id:
            continue  # Skip self-rating
        
        # Verify the user being rated was part of the trip
        is_rated_user_driver = trip.driver_id == rating_item.user_id
        is_rated_user_member = db.query(TripMember).filter(
            and_(
                TripMember.trip_id == trip.id,
                TripMember.user_id == rating_item.user_id,
                TripMember.status == MemberStatus.APPROVED
            )
        ).first() is not None
        
        if not (is_rated_user_driver or is_rated_user_member):
            continue  # Skip users not part of the trip
        
        # Check if rating already exists
        existing_rating = db.query(Rating).filter(
            and_(
                Rating.trip_id == trip.id,
                Rating.rater_id == current_user.id,
                Rating.rated_user_id == rating_item.user_id
            )
        ).first()
        
        if existing_rating:
            continue  # Skip duplicate ratings
        
        # Create rating
        rating = Rating(
            trip_id=trip.id,
            rater_id=current_user.id,
            rated_user_id=rating_item.user_id,
            rating=rating_item.rating,
            comment=rating_item.comment
        )
        
        db.add(rating)
        created_ratings.append(rating)
    
    db.commit()
    
    # Update user ratings (this would typically be done by a background job)
    for rating in created_ratings:
        rated_user = db.query(User).filter(User.id == rating.rated_user_id).first()
        if rated_user:
            # Recalculate average rating
            all_ratings = db.query(Rating).filter(Rating.rated_user_id == rated_user.id).all()
            if all_ratings:
                total_rating = sum(r.rating for r in all_ratings)
                rated_user.rating = total_rating / len(all_ratings)
                rated_user.total_ratings = len(all_ratings)
    
    db.commit()
    
    return {"message": f"Successfully rated {len(created_ratings)} participants"}
