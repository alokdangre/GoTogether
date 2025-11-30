"""
Auto-grouping utilities for railway station trips.

This module provides functions to automatically group users going to railway stations
within a 6-hour window, manage driver queues, and handle seat availability.
"""

from datetime import datetime, timedelta
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from ..models.grouped_ride import GroupedRide
from ..models.ride_request import RideRequest
from ..models.driver import Driver
from ..models.ride_notification import RideNotification
from ..models.system_notification import SystemNotification
from ..models.admin import Admin


def calculate_available_seats(grouped_ride: GroupedRide) -> int:
    """Calculate the number of available seats in a grouped ride."""
    occupied_seats = len(grouped_ride.ride_requests) if grouped_ride.ride_requests else 0
    return max(0, grouped_ride.total_seats - occupied_seats)


def find_matching_railway_station_trip(
    db: Session,
    destination_address: str,
    requested_time: datetime,
    time_window_hours: int = 6
) -> Optional[GroupedRide]:
    """
    Find an existing railway station trip within the time window with available seats.
    
    Args:
        db: Database session
        destination_address: Destination address to match
        requested_time: Requested pickup/arrival time
        time_window_hours: Time window in hours (default: 6)
    
    Returns:
        GroupedRide if found, None otherwise
    """
    # Calculate time window
    time_start = requested_time - timedelta(hours=time_window_hours)
    time_end = requested_time + timedelta(hours=time_window_hours)
    
    # Find matching trips
    matching_trips = db.query(GroupedRide).filter(
        and_(
            GroupedRide.is_railway_station_trip == True,
            GroupedRide.destination_address.ilike(f"%{destination_address}%"),
            GroupedRide.pickup_time.between(time_start, time_end),
            GroupedRide.status.in_(['pending_acceptance', 'confirmed']),
        )
    ).all()
    
    # Find trip with available seats
    for trip in matching_trips:
        if calculate_available_seats(trip) > 0:
            return trip
    
    return None


def get_next_available_driver(db: Session) -> Optional[Driver]:
    """
    Get the next available driver from the queue (fair distribution).
    
    Drivers are selected based on:
    1. Available and verified status
    2. Lowest assigned_rides_count (fairness)
    3. Earliest updated_at (round-robin for ties)
    
    Returns:
        Driver if available, None otherwise
    """
    driver = db.query(Driver).filter(
        and_(
            Driver.is_active == True,
            Driver.is_verified == True,
            Driver.availability_status == 'available'
        )
    ).order_by(
        Driver.assigned_rides_count.asc(),
        Driver.updated_at.asc()
    ).first()
    
    return driver


def create_railway_station_trip(
    db: Session,
    ride_request: RideRequest,
    admin_id: str
) -> Tuple[GroupedRide, bool]:
    """
    Create a new auto-grouped railway station trip.
    
    Args:
        db: Database session
        ride_request: The ride request triggering the creation
        admin_id: ID of the system admin (for auto-created trips)
    
    Returns:
        Tuple of (GroupedRide, success_flag)
    """
    # Get next available driver
    driver = get_next_available_driver(db)
    
    if not driver:
        # No driver available, return None and False flag
        return None, False
    
    # Create the grouped ride
    grouped_ride = GroupedRide(
        admin_id=admin_id,
        driver_id=driver.id,
        destination_address=ride_request.destination_address,
        pickup_time=ride_request.requested_time,
        pickup_location=ride_request.source_address,
        total_seats=4,
        is_railway_station_trip=True,
        auto_created=True,
        status='pending_acceptance'
    )
    
    db.add(grouped_ride)
    db.flush()  # Get the ID
    
    # Update driver stats
    driver.assigned_rides_count += 1
    
    return grouped_ride, True


def add_to_existing_trip(
    db: Session,
    ride_request: RideRequest,
    grouped_ride: GroupedRide
) -> bool:
    """
    Add a ride request to an existing grouped trip.
    
    Args:
        db: Database session
        ride_request: The ride request to add
        grouped_ride: The grouped ride to add to
    
    Returns:
        True if successful, False otherwise
    """
    # Check if seats are available
    if calculate_available_seats(grouped_ride) <= 0:
        return False
    
    # Update the ride request
    ride_request.grouped_ride_id = grouped_ride.id
    ride_request.status = 'grouped'
    
    # Create ride assignment notification
    notification = RideNotification(
        user_id=ride_request.user_id,
        grouped_ride_id=grouped_ride.id,
        notification_type='ride_assignment',
        status='pending'
    )
    db.add(notification)
    
    # Create system notification about group chat
    chat_notification = SystemNotification(
        user_id=ride_request.user_id,
        title='Group Chat Available',
        message='Your ride has been grouped! You can now chat with other passengers and the driver. Please accept or reject the ride assignment.'
    )
    db.add(chat_notification)
    
    return True


def auto_group_railway_station_request(
    db: Session,
    ride_request: RideRequest,
    system_admin_id: str
) -> Tuple[Optional[GroupedRide], str]:
    """
    Main auto-grouping function for railway station requests.
    
    This function:
    1. Checks if there's an existing trip within 6 hours with available seats
    2. If yes, adds the user to that trip
    3. If no, creates a new trip with the next available driver
    
    Args:
        db: Database session
        ride_request: The railway station ride request to process
        system_admin_id: ID of the system admin for auto-created trips
    
    Returns:
        Tuple of (GroupedRide or None, status_message)
    """
    # Find matching trip
    matching_trip = find_matching_railway_station_trip(
        db,
        ride_request.destination_address,
        ride_request.requested_time
    )
    
    if matching_trip:
        # Add to existing trip
        success = add_to_existing_trip(db, ride_request, matching_trip)
        if success:
            return matching_trip, 'added_to_existing'
        else:
            # No seats available (race condition possible)
            return None, 'no_seats_available'
    
    # No matching trip found, create new one
    grouped_ride, success = create_railway_station_trip(db, ride_request, system_admin_id)
    
    if success:
        # Add the initial ride request to the new trip
        add_to_existing_trip(db, ride_request, grouped_ride)
        return grouped_ride, 'new_trip_created'
    else:
        return None, 'no_driver_available'
