from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.auth import get_current_user
from ..core.database import get_db
from ..models.driver import Driver
from ..models.user import User
from ..schemas.driver import Driver as DriverSchema, DriverCreate, DriverUpdate

router = APIRouter(prefix="/api/drivers", tags=["Drivers"])


@router.get("/me", response_model=DriverSchema)
async def get_my_driver_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the logged-in user's driver profile."""
    driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver profile not found")
    return driver


@router.post("", response_model=DriverSchema, status_code=status.HTTP_201_CREATED)
async def create_driver_profile(
    payload: DriverCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a driver profile for the current user."""
    existing = db.query(Driver).filter(Driver.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Driver profile already exists")

    driver = Driver(user_id=current_user.id, **payload.dict())
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return driver


@router.patch("/me", response_model=DriverSchema)
async def update_driver_profile(
    payload: DriverUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the current user's driver profile."""
    driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver profile not found")

    update_data = payload.dict(exclude_unset=True)

    if "is_verified" in update_data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Driver verification can only be updated by administrators",
        )

    for field, value in update_data.items():
        setattr(driver, field, value)

    db.commit()
    db.refresh(driver)
    return driver
