from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..core.database import get_db
from ..core.auth import get_current_user
from ..models.user import User
from ..models.ride_request import RideRequest
from ..schemas.ride_request import (
    RideRequestCreate,
    RideRequest as RideRequestSchema,
    RideRequestWithUser
)

router = APIRouter(prefix="/api/ride-requests", tags=["Ride Requests"])


@router.post("", response_model=RideRequestSchema, status_code=status.HTTP_201_CREATED)
async def create_ride_request(
    request_data: RideRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """User creates a new ride request"""
    ride_request = RideRequest(
        user_id=current_user.id,
        source_lat=request_data.source_lat,
        source_lng=request_data.source_lng,
        source_address=request_data.source_address,
        destination_lat=request_data.destination_lat,
        destination_lng=request_data.destination_lng,
        destination_address=request_data.destination_address,
        is_railway_station=request_data.is_railway_station,
        train_time=request_data.train_time,
        requested_time=request_data.requested_time,
        passenger_count=request_data.passenger_count,
        additional_info=request_data.additional_info,
        status="pending"
    )
    
    db.add(ride_request)
    db.commit()
    db.refresh(ride_request)
    
    return RideRequestSchema.from_orm(ride_request)


@router.get("/my-requests", response_model=List[RideRequestSchema])
async def get_my_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's ride requests"""
    requests = db.query(RideRequest).filter(
        RideRequest.user_id == current_user.id
    ).order_by(RideRequest.created_at.desc()).all()
    
    return [RideRequestSchema.from_orm(req) for req in requests]


@router.get("/history", response_model=List[RideRequestSchema])
async def get_ride_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's completed and cancelled rides"""
    requests = db.query(RideRequest).filter(
        RideRequest.user_id == current_user.id,
        RideRequest.status.in_(["completed", "cancelled"])
    ).order_by(RideRequest.created_at.desc()).all()
    
    return [RideRequestSchema.from_orm(req) for req in requests]


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_ride_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """User cancels their pending ride request"""
    ride_request = db.query(RideRequest).filter(
        RideRequest.id == request_id,
        RideRequest.user_id == current_user.id
    ).first()
    
    if not ride_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ride request not found"
        )
    
    if ride_request.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only cancel pending requests"
        )
    
    ride_request.status = "cancelled"
    db.commit()
    
    return None
