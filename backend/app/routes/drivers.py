from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.auth import require_driver_user
from ..core.database import get_db
from ..models.driver import Driver
from ..models.user import User
from ..schemas.driver import Driver as DriverSchema, DriverUpdate
from ..schemas.user import User as UserSchema

router = APIRouter(prefix="/api/drivers", tags=["Drivers"])


@router.get("/me", response_model=UserSchema)
async def get_my_driver_profile(
    current_user: User = Depends(require_driver_user),
    db: Session = Depends(get_db),
):
    """Return the authenticated driver's full profile (user + driver extension)."""
    driver = db.query(Driver).filter(Driver.id == current_user.id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver profile not found")
    db.refresh(current_user, attribute_names=["driver_profile"])
    return current_user


@router.patch("/me", response_model=DriverSchema)
async def update_my_driver_profile(
    payload: DriverUpdate,
    current_user: User = Depends(require_driver_user),
    db: Session = Depends(get_db),
):
    """Update the authenticated driver's profile."""
    driver = db.query(Driver).filter(Driver.id == current_user.id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver profile not found")

    update_data = payload.dict(exclude_unset=True)

    if "is_verified" in update_data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Driver verification can only be updated by administrators",
        )

    if "is_active" in update_data and not update_data["is_active"] and driver.is_active:
        driver.is_active = False
        update_data.pop("is_active")

    for field, value in update_data.items():
        setattr(driver, field, value)

    db.commit()
    db.refresh(driver)
    db.refresh(current_user, attribute_names=["driver_profile"])
    return driver
