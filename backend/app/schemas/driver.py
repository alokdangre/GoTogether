from datetime import datetime
from typing import Optional
import uuid

from pydantic import BaseModel, Field


class DriverBase(BaseModel):
    license_number: Optional[str] = Field(None, max_length=100)
    license_document_url: Optional[str] = Field(None, max_length=500)
    vehicle_type: Optional[str] = Field(None, max_length=50)
    vehicle_make: Optional[str] = Field(None, max_length=100)
    vehicle_model: Optional[str] = Field(None, max_length=100)
    vehicle_color: Optional[str] = Field(None, max_length=50)
    vehicle_plate_number: Optional[str] = Field(None, max_length=50)
    vehicle_document_url: Optional[str] = Field(None, max_length=500)


class DriverCreate(DriverBase):
    license_number: str = Field(..., max_length=100)
    vehicle_plate_number: str = Field(..., max_length=50)


class DriverUpdate(DriverBase):
    is_verified: Optional[bool] = None


class Driver(DriverBase):
    id: uuid.UUID
    user_id: uuid.UUID
    is_verified: bool
    verified_at: Optional[datetime]
    deactivated_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
