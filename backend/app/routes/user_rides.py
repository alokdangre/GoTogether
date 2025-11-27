from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
from datetime import datetime

from ..core.database import get_db
from ..core.auth import get_current_user
from ..models.user import User
from ..models.ride_request import RideRequest
from ..models.grouped_ride import GroupedRide
from ..models.rating import Rating
from ..schemas.grouped_ride import GroupedRideDetail
from ..schemas.user import UserStats

router = APIRouter(prefix="/api/my-rides", tags=["User Rides"])


@router.get("/upcoming", response_model=List[GroupedRideDetail])
async def get_upcoming_rides(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's accepted upcoming rides"""
    # Get ride requests that are accepted
    ride_requests = db.query(RideRequest).filter(
        and_(
            RideRequest.user_id == current_user.id,
            RideRequest.status == "accepted",
            RideRequest.grouped_ride_id.isnot(None)
        )
    ).all()
    
    # Get unique grouped rides
    grouped_ride_ids = list(set([req.grouped_ride_id for req in ride_requests]))
    grouped_rides = db.query(GroupedRide).filter(
        and_(
            GroupedRide.id.in_(grouped_ride_ids),
            GroupedRide.status.in_(["confirmed", "in_progress"])
        )
    ).order_by(GroupedRide.pickup_time).all()
    
    return [GroupedRideDetail.from_orm(ride) for ride in grouped_rides]


@router.get("/completed", response_model=List[GroupedRideDetail])
async def get_completed_rides(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's completed rides with savings info"""
    ride_requests = db.query(RideRequest).filter(
        and_(
            RideRequest.user_id == current_user.id,
            RideRequest.status == "completed",
            RideRequest.grouped_ride_id.isnot(None)
        )
    ).all()
    
    grouped_ride_ids = list(set([req.grouped_ride_id for req in ride_requests]))
    grouped_rides = db.query(GroupedRide).filter(
        and_(
            GroupedRide.id.in_(grouped_ride_ids),
            GroupedRide.status == "completed"
        )
    ).order_by(GroupedRide.created_at.desc()).all()
    
    return [GroupedRideDetail.from_orm(ride) for ride in grouped_rides]


@router.get("/stats", response_model=UserStats)
async def get_ride_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's total rides and savings"""
    return UserStats(
        total_rides=current_user.total_rides,
        total_savings=current_user.total_savings,
        average_rating=current_user.rating
    )


@router.post("/{ride_id}/rate", status_code=status.HTTP_201_CREATED)
async def rate_ride(
    ride_id: str,
    rating_value: int,
    comment: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rate completed ride and generate testimonial"""
    # Verify user was part of this ride
    ride_request = db.query(RideRequest).filter(
        and_(
            RideRequest.user_id == current_user.id,
            RideRequest.grouped_ride_id == ride_id,
            RideRequest.status == "completed"
        )
    ).first()
    
    if not ride_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ride not found or not completed"
        )
    
    grouped_ride = db.query(GroupedRide).filter(GroupedRide.id == ride_id).first()
    
    if not grouped_ride or not grouped_ride.driver_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ride or no driver assigned"
        )
    
    # Check if already rated
    existing_rating = db.query(Rating).filter(
        and_(
            Rating.user_id == current_user.id,
            Rating.grouped_ride_id == ride_id
        )
    ).first()
    
    if existing_rating:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ride already rated"
        )
    
    # Generate testimonial text
    user_name = current_user.name or "A GoTogether User"
    savings = (grouped_ride.actual_price - grouped_ride.charged_price) if (grouped_ride.actual_price and grouped_ride.charged_price) else 0
    
    testimonial = f"""🚗 GoTogether Ride Review 🚗

I recently used GoTogether for my ride to {grouped_ride.destination_address}.

Rating: {'⭐' * rating_value}
{f'Review: {comment}' if comment else ''}

{f'I saved ₹{savings:.2f} compared to regular fares!' if savings > 0 else ''}

Highly recommend GoTogether for affordable and reliable shared rides!

- {user_name}"""
    
    # Create rating
    rating = Rating(
        user_id=current_user.id,
        driver_id=grouped_ride.driver_id,
        grouped_ride_id=ride_id,
        rating=rating_value,
        comment=comment,
        testimonial_text=testimonial
    )
    
    db.add(rating)
    
    # Update driver rating
    driver = grouped_ride.driver
    driver.total_ratings += 1
    driver.rating = ((driver.rating * (driver.total_ratings - 1)) + rating_value) / driver.total_ratings
    
    # Update user stats
    current_user.total_ratings += 1
    
    db.commit()
    
    return {
        "message": "Rating submitted successfully",
        "testimonial": testimonial
    }
