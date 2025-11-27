from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..core.database import get_db
from ..core.auth import get_current_admin
from ..models.admin import Admin
from ..models.ride_request import RideRequest
from ..models.grouped_ride import GroupedRide
from ..models.ride_notification import RideNotification
from ..models.driver import Driver
from ..schemas.ride_request import RideRequestWithUser
from ..schemas.grouped_ride import (
    GroupedRideCreate,
    GroupedRide as GroupedRideSchema,
    GroupedRideDetail,
    RideAssignment,
    PricingUpdate,
    GroupedRideUpdate
)

router = APIRouter(prefix="/api/admin/rides", tags=["Admin - Rides"])


@router.get("/requests", response_model=List[RideRequestWithUser])
async def get_pending_requests(
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all pending ride requests for grouping"""
    requests = db.query(RideRequest).filter(
        RideRequest.status == "pending"
    ).order_by(RideRequest.requested_time).all()
    
    return [RideRequestWithUser.from_orm(req) for req in requests]


@router.post("/grouped-rides", response_model=GroupedRideDetail, status_code=status.HTTP_201_CREATED)
async def create_grouped_ride(
    ride_data: GroupedRideCreate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin creates a grouped ride from multiple requests"""
    # Verify all ride requests exist and are pending
    ride_requests = db.query(RideRequest).filter(
        RideRequest.id.in_(ride_data.ride_request_ids),
        RideRequest.status == "pending"
    ).all()
    
    if len(ride_requests) != len(ride_data.ride_request_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Some ride requests not found or not pending"
        )
    
    # Create grouped ride
    grouped_ride = GroupedRide(
        admin_id=current_admin.id,
        destination_address=ride_data.destination_address,
        status="pending_acceptance"
    )
    
    db.add(grouped_ride)
    db.flush()
    
    # Update ride requests to link to grouped ride
    for request in ride_requests:
        request.status = "grouped"
        request.grouped_ride_id = grouped_ride.id
    
    db.commit()
    db.refresh(grouped_ride)
    
    return GroupedRideDetail.from_orm(grouped_ride)


@router.put("/grouped-rides/{ride_id}/assign-driver", response_model=GroupedRideDetail)
async def assign_driver(
    ride_id: str,
    assignment: RideAssignment,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Assign a driver to a grouped ride and send notifications"""
    grouped_ride = db.query(GroupedRide).filter(GroupedRide.id == ride_id).first()
    
    if not grouped_ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grouped ride not found"
        )
    
    # Verify driver exists and is available
    driver = db.query(Driver).filter(
        Driver.id == assignment.driver_id,
        Driver.is_active == True
    ).first()
    
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driver not found or not active"
        )
    
    # Assign driver
    grouped_ride.driver_id = assignment.driver_id
    grouped_ride.status = "pending_acceptance"
    
    # Create notifications for all users in this ride
    for ride_request in grouped_ride.ride_requests:
        notification = RideNotification(
            user_id=ride_request.user_id,
            grouped_ride_id=grouped_ride.id,
            notification_type="ride_assignment",
            status="pending"
        )
        db.add(notification)
        ride_request.status = "assigned"
    
    # Update driver stats
    driver.assigned_rides_count += 1
    
    db.commit()
    db.refresh(grouped_ride)
    
    return GroupedRideDetail.from_orm(grouped_ride)


@router.put("/grouped-rides/{ride_id}/pricing", response_model=GroupedRideDetail)
async def update_pricing(
    ride_id: str,
    pricing: PricingUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Set actual and charged prices for savings calculation"""
    grouped_ride = db.query(GroupedRide).filter(GroupedRide.id == ride_id).first()
    
    if not grouped_ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grouped ride not found"
        )
    
    grouped_ride.actual_price = pricing.actual_price
    grouped_ride.charged_price = pricing.charged_price
    
    db.commit()
    db.refresh(grouped_ride)
    
    return GroupedRideDetail.from_orm(grouped_ride)


@router.get("/grouped-rides", response_model=List[GroupedRideDetail])
async def get_grouped_rides(
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all grouped rides"""
    rides = db.query(GroupedRide).order_by(GroupedRide.created_at.desc()).all()
    return [GroupedRideDetail.from_orm(ride) for ride in rides]


@router.put("/grouped-rides/{ride_id}", response_model=GroupedRideDetail)
async def update_grouped_ride(
    ride_id: str,
    update_data: GroupedRideUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update grouped ride details"""
    grouped_ride = db.query(GroupedRide).filter(GroupedRide.id == ride_id).first()
    
    if not grouped_ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grouped ride not found"
        )
    
    # Update fields
    update_dict = update_data.dict(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(grouped_ride, field, value)
    
    db.commit()
    db.refresh(grouped_ride)
    
    return GroupedRideDetail.from_orm(grouped_ride)
