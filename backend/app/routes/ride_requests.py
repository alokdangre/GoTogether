from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..core.database import get_db
from ..core.auth import get_current_user
from ..models.user import User
from ..models.ride_request import RideRequest
from ..models.grouped_ride import GroupedRide
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
    
    # Auto-grouping for railway station trips
    if ride_request.is_railway_station:
        from ..utils.auto_grouping import auto_group_railway_station_request
        from ..models.admin import Admin
        
        # Get system admin (first admin or create one)
        system_admin = db.query(Admin).first()
        
        if system_admin:
            try:
                grouped_ride, status_msg = auto_group_railway_station_request(
                    db,
                    ride_request,
                    str(system_admin.id)
                )
                
                if grouped_ride:
                    db.commit()
                    # Refresh to get updated relations
                    db.refresh(ride_request)
            except Exception as e:
                # Log error but don't fail the request creation
                print(f"Auto-grouping error: {str(e)}")
                db.rollback()
                # Create a system notification about the error for admins
                from ..models.system_notification import SystemNotification
                admin_notification = SystemNotification(
                    user_id=current_user.id,
                    title="Ride Request Created",
                    message="Your railway station ride request has been created. An admin will group your ride shortly."
                )
                db.add(admin_notification)
                db.commit()
    
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





@router.post("/{request_id}/accept", status_code=status.HTTP_200_OK)
async def accept_ride_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """User accepts the assigned grouped ride"""
    ride_request = db.query(RideRequest).filter(
        RideRequest.id == request_id,
        RideRequest.user_id == current_user.id
    ).first()
    
    if not ride_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ride request not found"
        )
    
    if ride_request.status != "grouped":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only accept grouped requests"
        )
    
    ride_request.status = "accepted"
    
    # Check if all requests in the group are accepted
    if ride_request.grouped_ride_id:
        grouped_ride = db.query(GroupedRide).filter(GroupedRide.id == ride_request.grouped_ride_id).first()
        if grouped_ride:
            # Check if there are any requests that are NOT accepted (excluding cancelled/rejected)
            # Actually, we want to know if ALL active requests are accepted.
            # But for simplicity, let's just check if all associated requests are accepted.
            # We need to be careful about concurrency here, but for MVP it's fine.
            
            # Refresh relationship
            db.refresh(grouped_ride)
            
            all_accepted = True
            for req in grouped_ride.ride_requests:
                if req.id != ride_request.id and req.status != "accepted" and req.status != "cancelled":
                    all_accepted = False
                    break
            
            if all_accepted:
                grouped_ride.status = "confirmed"
    
    db.commit()
    
    return {"message": "Ride accepted successfully"}


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
