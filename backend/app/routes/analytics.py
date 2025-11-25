from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Optional

from ..core.database import get_db
from ..core.auth import get_current_admin
from ..models.admin import Admin
from ..models.trip import Trip, TripStatus
from ..models.user import User
from ..models.driver import Driver

router = APIRouter(prefix="/api/admin/analytics", tags=["Analytics"])


@router.get("/overview")
async def get_overview(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Get overall statistics"""
    # Parse dates
    start = datetime.fromisoformat(start_date) if start_date else datetime(2020, 1, 1)
    end = datetime.fromisoformat(end_date) if end_date else datetime.now()
    
    # Total trips
    total_trips = db.query(Trip).filter(
        Trip.created_at >= start,
        Trip.created_at <= end
    ).count()
    
    # Total revenue
    total_revenue = db.query(func.sum(Trip.fare_per_person * (Trip.total_seats - Trip.available_seats))).filter(
        Trip.created_at >= start,
        Trip.created_at <= end,
        Trip.status == TripStatus.COMPLETED
    ).scalar() or 0
    
    # Total users
    total_users = db.query(User).filter(
        User.created_at >= start,
        User.created_at <= end
    ).count()
    
    # Active drivers
    active_drivers = db.query(Driver).filter(
        Driver.is_active == True,
        Driver.is_verified == True
    ).count()
    
    # Active trips
    active_trips = db.query(Trip).filter(
        Trip.status == TripStatus.ACTIVE
    ).count()
    
    return {
        "total_trips": total_trips,
        "total_revenue": float(total_revenue),
        "total_users": total_users,
        "active_drivers": active_drivers,
        "active_trips": active_trips,
    }


@router.get("/trips-timeline")
async def get_trips_timeline(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    interval: str = "day",  # day, week, month
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Get trips over time grouped by status"""
    start = datetime.fromisoformat(start_date) if start_date else datetime.now() - timedelta(days=30)
    end = datetime.fromisoformat(end_date) if end_date else datetime.now()
    
    # Get all trips in date range
    trips = db.query(Trip).filter(
        Trip.created_at >= start,
        Trip.created_at <= end
    ).all()
    
    # Group by date and status
    timeline = {}
    for trip in trips:
        date_key = trip.created_at.date().isoformat()
        if date_key not in timeline:
            timeline[date_key] = {
                "date": date_key,
                "active": 0,
                "completed": 0,
                "cancelled": 0,
                "total": 0
            }
        
        status_key = trip.status.value if trip.status else "active"
        timeline[date_key][status_key] = timeline[date_key].get(status_key, 0) + 1
        timeline[date_key]["total"] += 1
    
    return sorted(timeline.values(), key=lambda x: x["date"])


@router.get("/revenue")
async def get_revenue_stats(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Get revenue statistics over time"""
    start = datetime.fromisoformat(start_date) if start_date else datetime.now() - timedelta(days=30)
    end = datetime.fromisoformat(end_date) if end_date else datetime.now()
    
    # Get completed trips
    trips = db.query(Trip).filter(
        Trip.created_at >= start,
        Trip.created_at <= end,
        Trip.status == TripStatus.COMPLETED
    ).all()
    
    # Group by date and vehicle type
    revenue_data = {}
    for trip in trips:
        date_key = trip.created_at.date().isoformat()
        if date_key not in revenue_data:
            revenue_data[date_key] = {
                "date": date_key,
                "total": 0,
                "car": 0,
                "auto": 0,
                "bike": 0
            }
        
        revenue = trip.fare_per_person * (trip.total_seats - trip.available_seats)
        revenue_data[date_key]["total"] += revenue
        
        vehicle_type = trip.vehicle_type.value if trip.vehicle_type else "car"
        revenue_data[date_key][vehicle_type] = revenue_data[date_key].get(vehicle_type, 0) + revenue
    
    return sorted(revenue_data.values(), key=lambda x: x["date"])


@router.get("/drivers")
async def get_driver_performance(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Get top performing drivers"""
    drivers = db.query(Driver).filter(
        Driver.is_active == True
    ).order_by(Driver.total_trips.desc()).limit(limit).all()
    
    result = []
    for driver in drivers:
        result.append({
            "id": str(driver.id),
            "name": driver.user.name if driver.user else "Unknown",
            "total_trips": driver.total_trips,
            "rating": driver.rating,
            "is_verified": driver.is_verified,
            "vehicle": f"{driver.vehicle_make} {driver.vehicle_model}" if driver.vehicle_make else "N/A"
        })
    
    return result


@router.get("/status-distribution")
async def get_status_distribution(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Get trip status distribution for pie chart"""
    start = datetime.fromisoformat(start_date) if start_date else datetime(2020, 1, 1)
    end = datetime.fromisoformat(end_date) if end_date else datetime.now()
    
    # Count by status
    status_counts = db.query(
        Trip.status,
        func.count(Trip.id)
    ).filter(
        Trip.created_at >= start,
        Trip.created_at <= end
    ).group_by(Trip.status).all()
    
    result = []
    for status, count in status_counts:
        result.append({
            "name": status.value if status else "unknown",
            "value": count
        })
    
    return result
