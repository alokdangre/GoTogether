from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.auth import (
    create_driver_access_token,
    get_password_hash,
    verify_password,
)
from ..core.database import get_db
from ..models.driver import Driver
from ..schemas.driver import Driver as DriverSchema, DriverCreate, DriverLoginRequest, DriverToken

router = APIRouter(prefix="/api/driver-auth", tags=["Driver Authentication"])


@router.post("/signup", response_model=DriverToken, status_code=status.HTTP_201_CREATED)
async def driver_signup(payload: DriverCreate, db: Session = Depends(get_db)):
    """Register a new driver account."""
    # Ensure unique phone/email
    existing_query = db.query(Driver)
    if db.query(Driver).filter(Driver.phone == payload.phone).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone already registered")
    if payload.email and db.query(Driver).filter(Driver.email == payload.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    if db.query(Driver).filter(Driver.license_number == payload.license_number).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="License number already registered")
    if db.query(Driver).filter(Driver.vehicle_plate_number == payload.vehicle_plate_number).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Vehicle plate number already registered")

    driver_data = payload.dict(exclude={"password"})
    hashed_password = get_password_hash(payload.password)

    driver = Driver(**driver_data, hashed_password=hashed_password, is_verified=False)
    db.add(driver)
    db.commit()
    db.refresh(driver)

    token = create_driver_access_token({"sub": str(driver.id)})
    return DriverToken(access_token=token, driver=DriverSchema.from_orm(driver))


@router.post("/login", response_model=DriverToken)
async def driver_login(payload: DriverLoginRequest, db: Session = Depends(get_db)):
    """Authenticate an existing driver using phone or email."""
    if not payload.phone and not payload.email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Phone or email is required")

    query = db.query(Driver)
    if payload.phone:
        driver = query.filter(Driver.phone == payload.phone).first()
    else:
        driver = query.filter(Driver.email == payload.email).first()

    if not driver or not driver.hashed_password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not verify_password(payload.password, driver.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not driver.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Driver account is inactive")

    token = create_driver_access_token({"sub": str(driver.id)})
    return DriverToken(access_token=token, driver=DriverSchema.from_orm(driver))
