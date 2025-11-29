from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime

from ..core.database import get_db
from ..core.auth import get_current_user
from ..models.user import User
from ..models.ride_notification import RideNotification
from ..models.ride_request import RideRequest
from ..models.grouped_ride import GroupedRide
from ..models.driver import Driver
from ..schemas.notification import (
    Notification,
    NotificationResponse,
    NotificationWithDetails,
    NotificationsList,
    SystemNotification as SystemNotificationSchema
)
from ..models.system_notification import SystemNotification

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("", response_model=NotificationsList)
async def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's notifications"""
    ride_notifications = db.query(RideNotification).options(
        joinedload(RideNotification.grouped_ride).joinedload(GroupedRide.driver)
    ).filter(
        RideNotification.user_id == current_user.id
    ).order_by(RideNotification.sent_at.desc()).all()
    
    system_notifications = db.query(SystemNotification).filter(
        SystemNotification.user_id == current_user.id
    ).order_by(SystemNotification.created_at.desc()).all()
    
    return {
        "ride_notifications": [NotificationWithDetails.from_orm(notif) for notif in ride_notifications],
        "system_notifications": [SystemNotificationSchema.from_orm(notif) for notif in system_notifications]
    }


@router.post("/system/{notification_id}/read", response_model=SystemNotificationSchema)
async def mark_system_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark system notification as read"""
    notification = db.query(SystemNotification).filter(
        SystemNotification.id == notification_id,
        SystemNotification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    
    return SystemNotificationSchema.from_orm(notification)


@router.put("/{notification_id}/accept", response_model=Notification)
async def accept_ride(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """User accepts ride assignment"""
    notification = db.query(RideNotification).filter(
        RideNotification.id == notification_id,
        RideNotification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    if notification.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Notification already responded to"
        )
    
    # Update notification
    notification.status = "accepted"
    notification.responded_at = datetime.utcnow()
    
    # Update ride request status
    ride_request = db.query(RideRequest).filter(
        RideRequest.user_id == current_user.id,
        RideRequest.grouped_ride_id == notification.grouped_ride_id
    ).first()
    
    if ride_request:
        ride_request.status = "accepted"
    
    # Check if all users have accepted
    grouped_ride = notification.grouped_ride
    all_notifications = db.query(RideNotification).filter(
        RideNotification.grouped_ride_id == grouped_ride.id,
        RideNotification.notification_type == "ride_assignment"
    ).all()
    
    if all(n.status == "accepted" for n in all_notifications):
        grouped_ride.status = "confirmed"
    
    db.commit()
    db.refresh(notification)
    
    return Notification.from_orm(notification)


@router.put("/{notification_id}/reject", response_model=Notification)
async def reject_ride(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """User rejects ride assignment"""
    notification = db.query(RideNotification).filter(
        RideNotification.id == notification_id,
        RideNotification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    if notification.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Notification already responded to"
        )
    
    # Update notification
    notification.status = "rejected"
    notification.responded_at = datetime.utcnow()
    
    # Update ride request status
    ride_request = db.query(RideRequest).filter(
        RideRequest.user_id == current_user.id,
        RideRequest.grouped_ride_id == notification.grouped_ride_id
    ).first()
    
    if ride_request:
        ride_request.status = "rejected"
        ride_request.grouped_ride_id = None
    
    db.commit()
    db.refresh(notification)
    
    return Notification.from_orm(notification)


@router.post("/{notification_id}/mark-read", response_model=Notification)
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark notification as read"""
    notification = db.query(RideNotification).filter(
        RideNotification.id == notification_id,
        RideNotification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    notification.status = "read"
    db.commit()
    db.refresh(notification)
    
    return Notification.from_orm(notification)
