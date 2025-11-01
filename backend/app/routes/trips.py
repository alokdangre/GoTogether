from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime, timedelta
import geohash2

from ..core.database import get_db
from ..core.auth import get_current_user, get_current_driver
from ..models.user import User
from ..models.driver import Driver
from ..models.trip import Trip, TripMember, TripStatus, MemberStatus
from ..schemas.trip import (
    TripCreate, Trip as TripSchema, TripWithDriver, TripDetail, 
    TripMemberCreate, TripMember as TripMemberSchema, TripUpdate,
    TripSearch, TripMatch
)
from ..utils.matching import (
    Location, TripQuery, TripCandidate, find_matching_trips,
    encode_geohash, get_search_geohashes
)

router = APIRouter(prefix="/api/trips", tags=["Trips"])


@router.post("", response_model=TripWithDriver, status_code=status.HTTP_201_CREATED)
async def create_trip(
    trip_data: TripCreate,
    current_driver: Driver = Depends(get_current_driver),
    db: Session = Depends(get_db)
):
    """Create a new trip"""
    # Encode geohashes for fast matching
    origin_geohash = encode_geohash(Location(trip_data.origin_lat, trip_data.origin_lng))
    dest_geohash = encode_geohash(Location(trip_data.dest_lat, trip_data.dest_lng))
    
    trip = Trip(
        driver_id=current_driver.id,
        origin_lat=trip_data.origin_lat,
        origin_lng=trip_data.origin_lng,
        origin_address=trip_data.origin_address,
        origin_geohash=origin_geohash,
        dest_lat=trip_data.dest_lat,
        dest_lng=trip_data.dest_lng,
        dest_address=trip_data.dest_address,
        dest_geohash=dest_geohash,
        departure_time=trip_data.departure_time,
        total_seats=trip_data.total_seats,
        available_seats=trip_data.total_seats,
        fare_per_person=trip_data.fare_per_person,
        vehicle_type=trip_data.vehicle_type,
        description=trip_data.description,
        status=TripStatus.ACTIVE
    )
    
    db.add(trip)
    db.commit()
    db.refresh(trip)
    
    # Return trip with driver info
    trip_with_driver = db.query(Trip).filter(Trip.id == trip.id).first()
    return TripWithDriver.from_orm(trip_with_driver)


@router.get("", response_model=List[TripWithDriver])
async def get_user_trips(
    status: Optional[TripStatus] = None,
    role: Optional[str] = Query(None, regex="^(passenger)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's trips (as driver or passenger)"""
    if role == "driver":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use driver authentication to view driver trips",
        )

    query = db.query(Trip)

    member_trip_ids = db.query(TripMember.trip_id).filter(
        and_(
            TripMember.user_id == current_user.id,
            TripMember.status == MemberStatus.APPROVED
        )
    ).subquery()
    query = query.filter(Trip.id.in_(member_trip_ids))
    
    if status:
        query = query.filter(Trip.status == status)
    
    trips = query.order_by(Trip.departure_time.desc()).all()
    return [TripWithDriver.from_orm(trip) for trip in trips]


@router.get("/driver", response_model=List[TripWithDriver])
async def get_driver_trips(
    status: Optional[TripStatus] = None,
    current_driver: Driver = Depends(get_current_driver),
    db: Session = Depends(get_db),
):
    """List trips created by the authenticated driver."""
    query = db.query(Trip).filter(Trip.driver_id == current_driver.id)

    if status:
        query = query.filter(Trip.status == status)

    trips = query.order_by(Trip.departure_time.desc()).all()
    return [TripWithDriver.from_orm(trip) for trip in trips]


@router.get("/search", response_model=dict)
async def search_trips(
    origin_lat: float = Query(..., ge=-90, le=90),
    origin_lng: float = Query(..., ge=-180, le=180),
    dest_lat: float = Query(..., ge=-90, le=90),
    dest_lng: float = Query(..., ge=-180, le=180),
    departure_time: datetime = Query(...),
    max_origin_distance: float = Query(2.0, gt=0, le=10),
    max_dest_distance: float = Query(3.0, gt=0, le=10),
    time_window_minutes: int = Query(15, gt=0, le=120),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search for matching trips"""
    # Create search query
    query = TripQuery(
        origin=Location(origin_lat, origin_lng),
        destination=Location(dest_lat, dest_lng),
        departure_time=departure_time,
        max_origin_distance=max_origin_distance,
        max_dest_distance=max_dest_distance,
        time_window_minutes=time_window_minutes
    )
    
    # Get geohashes for search
    origin_geohashes, dest_geohashes = get_search_geohashes(query)
    
    # Query database for candidate trips
    time_min = departure_time - timedelta(minutes=time_window_minutes)
    time_max = departure_time + timedelta(minutes=time_window_minutes)
    
    db_trips = db.query(Trip).filter(
        and_(
            Trip.status == TripStatus.ACTIVE,
            Trip.available_seats > 0,
            Trip.departure_time.between(time_min, time_max),
            or_(
                Trip.origin_geohash.like(f"{gh}%") for gh in origin_geohashes[:3]  # Limit for performance
            )
        )
    ).all()
    
    # Convert to candidates
    candidates = []
    for trip in db_trips:
        candidate = TripCandidate(
            id=str(trip.id),
            origin=Location(trip.origin_lat, trip.origin_lng),
            destination=Location(trip.dest_lat, trip.dest_lng),
            departure_time=trip.departure_time,
            available_seats=trip.available_seats,
            fare_per_person=trip.fare_per_person,
            driver_name=trip.driver.name or "Anonymous",
            driver_rating=trip.driver.rating
        )
        candidates.append(candidate)
    
    # Find matches using our algorithm
    matches = find_matching_trips(query, candidates)
    
    # Convert back to response format
    trip_matches = []
    for match in matches:
        # Get the original trip from database
        trip = db.query(Trip).filter(Trip.id == match.candidate.id).first()
        if trip:
            trip_match = TripMatch(
                **TripWithDriver.from_orm(trip).dict(),
                origin_distance=match.origin_distance,
                dest_distance=match.dest_distance,
                time_difference_minutes=match.time_difference_minutes,
                match_score=match.match_score
            )
            trip_matches.append(trip_match)
    
    return {
        "trips": trip_matches,
        "total": len(trip_matches)
    }


@router.get("/{trip_id}", response_model=TripDetail)
async def get_trip(
    trip_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get trip details"""
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    
    return TripDetail.from_orm(trip)


@router.patch("/{trip_id}", response_model=TripWithDriver)
async def update_trip(
    trip_id: str,
    trip_update: TripUpdate,
    current_driver: Driver = Depends(get_current_driver),
    db: Session = Depends(get_db)
):
    """Update trip details (driver only)"""
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    
    if trip.driver_id != current_driver.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this trip"
        )
    
    # Update fields
    update_data = trip_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(trip, field, value)
    
    # Update available seats if total seats changed
    if trip_update.total_seats is not None:
        approved_members = db.query(TripMember).filter(
            and_(
                TripMember.trip_id == trip.id,
                TripMember.status == MemberStatus.APPROVED
            )
        ).count()
        trip.available_seats = trip.total_seats - approved_members
    
    db.commit()
    db.refresh(trip)
    
    return TripWithDriver.from_orm(trip)


@router.post("/{trip_id}/join", response_model=TripMemberSchema, status_code=status.HTTP_201_CREATED)
async def join_trip(
    trip_id: str,
    member_data: TripMemberCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Request to join a trip"""
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    
    if trip.driver_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot join your own trip"
        )
    
    if trip.status != TripStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trip is not active"
        )
    
    if trip.available_seats < member_data.seats_requested:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not enough available seats"
        )
    
    # Check if already requested or member
    existing = db.query(TripMember).filter(
        and_(
            TripMember.trip_id == trip.id,
            TripMember.user_id == current_user.id
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Already requested or member of this trip"
        )
    
    # Create join request
    member = TripMember(
        trip_id=trip.id,
        user_id=current_user.id,
        seats_requested=member_data.seats_requested,
        message=member_data.message,
        status=MemberStatus.PENDING
    )
    
    db.add(member)
    db.commit()
    db.refresh(member)
    
    return TripMemberSchema.from_orm(member)


@router.post("/{trip_id}/members/{member_id}/approve", response_model=TripMemberSchema)
async def approve_member(
    trip_id: str,
    member_id: str,
    current_driver: Driver = Depends(get_current_driver),
    db: Session = Depends(get_db)
):
    """Approve join request (driver only)"""
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    
    if trip.driver_id != current_driver.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to approve members"
        )
    
    member = db.query(TripMember).filter(
        and_(
            TripMember.id == member_id,
            TripMember.trip_id == trip.id
        )
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member request not found"
        )
    
    if member.status != MemberStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Member request is not pending"
        )
    
    if trip.available_seats < member.seats_requested:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not enough available seats"
        )
    
    # Approve member
    member.status = MemberStatus.APPROVED
    trip.available_seats -= member.seats_requested
    
    # Update trip status if full
    if trip.available_seats == 0:
        trip.status = TripStatus.FULL
    
    db.commit()
    db.refresh(member)
    
    return TripMemberSchema.from_orm(member)
