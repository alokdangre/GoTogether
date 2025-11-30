from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid


class GroupedRideBase(BaseModel):
    destination_address: str = Field(..., max_length=500)
    pickup_time: Optional[datetime] = None
    pickup_location: Optional[str] = Field(None, max_length=500)
    actual_price: Optional[float] = Field(None, gt=0)
    charged_price: Optional[float] = Field(None, gt=0)
    total_seats: int = Field(default=4, ge=1, le=20)
    is_railway_station_trip: bool = Field(default=False)
    auto_created: bool = Field(default=False)



class GroupedRideCreate(BaseModel):
    ride_request_ids: List[uuid.UUID] = Field(..., min_items=1)
    destination_address: str = Field(..., max_length=500)


class GroupedRideAdminCreate(BaseModel):
    ride_request_ids: List[uuid.UUID] = Field(..., min_items=1)
    driver_id: uuid.UUID
    pickup_time: datetime
    pickup_location: str = Field(..., max_length=500)
    destination_address: str = Field(..., max_length=500)
    charged_price: float = Field(..., gt=0)
    total_seats: int = Field(default=4, ge=1, le=20)



class GroupedRideMerge(BaseModel):
    ride_request_ids: List[uuid.UUID] = Field(..., min_items=1)



class GroupedRide(GroupedRideBase):
    id: uuid.UUID
    admin_id: uuid.UUID
    driver_id: Optional[uuid.UUID]
    status: str
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# Removed GroupedRideDetail to avoid circular import issues
# Can be re-added later with proper handling if needed


class RideAssignment(BaseModel):
    driver_id: uuid.UUID


class PricingUpdate(BaseModel):
    actual_price: float = Field(..., gt=0)
    charged_price: float = Field(..., gt=0)


class GroupedRideUpdate(BaseModel):
    driver_id: Optional[uuid.UUID] = None
    pickup_time: Optional[datetime] = None
    pickup_location: Optional[str] = None
    actual_price: Optional[float] = None
    charged_price: Optional[float] = None
    status: Optional[str] = None
