from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.auth import get_current_driver, get_password_hash
from ..core.database import get_db
from ..models.driver import Driver
from ..schemas.driver import Driver as DriverSchema, DriverUpdate

router = APIRouter(prefix="/api/drivers", tags=["Drivers"])


@router.get("/me", response_model=DriverSchema)
async def get_my_driver_profile(
    current_driver: Driver = Depends(get_current_driver),
    db: Session = Depends(get_db),
):
    """Return the authenticated driver's profile."""
    return db.query(Driver).filter(Driver.id == current_driver.id).first()


@router.patch("/me", response_model=DriverSchema)
async def update_my_driver_profile(
    payload: DriverUpdate,
    current_driver: Driver = Depends(get_current_driver),
    db: Session = Depends(get_db),
):
    """Update the authenticated driver's profile."""
    driver = db.query(Driver).filter(Driver.id == current_driver.id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver profile not found")

    update_data = payload.dict(exclude_unset=True)

    if "is_verified" in update_data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Driver verification can only be updated by administrators",
        )

    if "phone" in update_data and update_data["phone"] != driver.phone:
        if db.query(Driver).filter(Driver.phone == update_data["phone"]).first():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone already in use")

    if "email" in update_data and update_data["email"] and update_data["email"] != driver.email:
        if db.query(Driver).filter(Driver.email == update_data["email"]).first():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already in use")

    if "is_active" in update_data and not update_data["is_active"] and driver.is_active:
        # allow driver to deactivate themselves
        driver.is_active = False
        update_data.pop("is_active")

    new_password = update_data.pop("password", None)

    for field, value in update_data.items():
        setattr(driver, field, value)

    if new_password:
        driver.hashed_password = get_password_hash(new_password)

    db.commit()
    db.refresh(driver)
    return driver
