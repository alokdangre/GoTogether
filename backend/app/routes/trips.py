from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from ..core.database import get_db
from ..core.auth import get_current_user
from ..models.user import User
from ..models.grouped_ride import GroupedRide
from ..schemas.grouped_ride import GroupedRide as GroupedRideSchema

router = APIRouter(prefix="/api/trips", tags=["Trips"])

@router.get("/{trip_id}", response_model=GroupedRideSchema)
async def get_trip_by_id(
    trip_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get trip details by ID (if user is participant)"""
    trip = db.query(GroupedRide).filter(GroupedRide.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    # Verify participation
    is_participant = False
    for req in trip.ride_requests:
        if req.user_id == current_user.id and req.status in ["accepted", "assigned", "completed"]:
            is_participant = True
            break
            
    if not is_participant:
        raise HTTPException(status_code=403, detail="Not authorized to view this trip")
        
    return GroupedRideSchema.from_orm(trip)
