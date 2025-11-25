from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..core.database import get_db
from ..core.auth import (
    get_current_admin,
    create_admin_token,
    get_password_hash,
    verify_password,
)
from ..models.admin import Admin
from ..models.user import User, UserRole
from ..models.driver import Driver
from ..models.rider import Rider
from ..models.trip import Trip
from ..schemas.auth import AdminLogin, AdminToken, DriverCreate
from ..schemas.user import User as UserSchema

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.post("/login", response_model=AdminToken)
async def admin_login(request: AdminLogin, db: Session = Depends(get_db)):
    """Admin login with email and password"""
    admin = db.query(Admin).filter(Admin.email == request.email).first()
    
    if not admin or not verify_password(request.password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive admin account"
        )
    
    token = create_admin_token(str(admin.id))
    return AdminToken(access_token=token)


@router.post("/drivers", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def create_driver(
    request: DriverCreate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Create a new driver account (admin only)"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.phone == request.phone).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this phone number already exists"
        )
    
    if request.email:
        existing_email = db.query(User).filter(User.email == request.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists"
            )
    
    # Create user with DRIVER role
    user = User(
        phone=request.phone,
        name=request.name,
        email=request.email,
        role=UserRole.DRIVER,
        is_verified=True,  # Admin-created drivers are pre-verified
        is_phone_verified=True,
        is_email_verified=bool(request.email),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create driver profile
    driver_profile = Driver(
        id=user.id,
        license_number=request.license_number,
        vehicle_type=request.vehicle_type,
        vehicle_make=request.vehicle_make,
        vehicle_model=request.vehicle_model,
        vehicle_color=request.vehicle_color,
        vehicle_plate_number=request.vehicle_plate_number,
        is_verified=False,  # Needs manual verification
    )
    db.add(driver_profile)
    db.commit()
    db.refresh(user)
    
    return UserSchema.from_orm(user)


@router.get("/users", response_model=List[UserSchema])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    role: Optional[UserRole] = None,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """List all users with pagination (admin only)"""
    query = db.query(User)
    
    if role:
        query = query.filter(User.role == role)
    
    users = query.offset(skip).limit(limit).all()
    return [UserSchema.from_orm(user) for user in users]


@router.get("/users/{user_id}", response_model=UserSchema)
async def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Get user details (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return UserSchema.from_orm(user)


@router.get("/drivers")
async def list_drivers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    is_verified: Optional[bool] = None,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """List all drivers with pagination (admin only)"""
    query = db.query(Driver)
    
    if is_verified is not None:
        query = query.filter(Driver.is_verified == is_verified)
    
    drivers = query.offset(skip).limit(limit).all()
    
    # Return driver data with user info
    result = []
    for driver in drivers:
        driver_data = {
            "id": str(driver.id),
            "user": UserSchema.from_orm(driver.user) if driver.user else None,
            "license_number": driver.license_number,
            "vehicle_type": driver.vehicle_type,
            "vehicle_make": driver.vehicle_make,
            "vehicle_model": driver.vehicle_model,
            "vehicle_color": driver.vehicle_color,
            "vehicle_plate_number": driver.vehicle_plate_number,
            "is_verified": driver.is_verified,
            "is_active": driver.is_active,
            "rating": driver.rating,
            "total_trips": driver.total_trips,
        }
        result.append(driver_data)
    
    return result


@router.patch("/drivers/{driver_id}")
async def update_driver(
    driver_id: str,
    is_verified: Optional[bool] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Update driver details (admin only)"""
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )
    
    if is_verified is not None:
        driver.is_verified = is_verified
        if is_verified:
            from datetime import datetime
            driver.verified_at = datetime.utcnow()
    
    if is_active is not None:
        driver.is_active = is_active
        if not is_active:
            from datetime import datetime
            driver.deactivated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(driver)
    
    return {"message": "Driver updated successfully"}


@router.get("/trips")
async def list_trips(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """List all trips with pagination (admin only)"""
    trips = db.query(Trip).offset(skip).limit(limit).all()
    
    result = []
    for trip in trips:
        trip_data = {
            "id": str(trip.id),
            "driver": UserSchema.from_orm(trip.driver) if trip.driver else None,
            "origin_address": trip.origin_address,
            "dest_address": trip.dest_address,
            "departure_time": trip.departure_time.isoformat(),
            "total_seats": trip.total_seats,
            "available_seats": trip.available_seats,
            "fare_per_person": trip.fare_per_person,
            "vehicle_type": trip.vehicle_type.value if trip.vehicle_type else None,
            "status": trip.status.value if trip.status else None,
            "created_at": trip.created_at.isoformat(),
        }
        result.append(trip_data)
    
    return result


@router.get("/trips/{trip_id}")
async def get_trip(
    trip_id: str,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Get trip details with members (admin only)"""
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    
    trip_data = {
        "id": str(trip.id),
        "driver": UserSchema.from_orm(trip.driver) if trip.driver else None,
        "origin_lat": trip.origin_lat,
        "origin_lng": trip.origin_lng,
        "origin_address": trip.origin_address,
        "dest_lat": trip.dest_lat,
        "dest_lng": trip.dest_lng,
        "dest_address": trip.dest_address,
        "departure_time": trip.departure_time.isoformat(),
        "total_seats": trip.total_seats,
        "available_seats": trip.available_seats,
        "fare_per_person": trip.fare_per_person,
        "vehicle_type": trip.vehicle_type.value if trip.vehicle_type else None,
        "status": trip.status.value if trip.status else None,
        "description": trip.description,
        "members": [
            {
                "id": str(member.id),
                "user": UserSchema.from_orm(member.user) if member.user else None,
                "seats_requested": member.seats_requested,
                "status": member.status.value if member.status else None,
                "message": member.message,
            }
            for member in trip.members
        ],
        "created_at": trip.created_at.isoformat(),
    }
    
    return trip_data


# Admin user management endpoints
async def get_super_admin(admin: Admin = Depends(get_current_admin)) -> Admin:
    """Dependency to ensure current admin is a super admin"""
    from ..models.admin import AdminRole
    if admin.role != AdminRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin privileges required"
        )
    return admin


@router.get("/admins")
async def list_admins(
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_super_admin)
):
    """List all admin users (super admin only)"""
    admins = db.query(Admin).all()
    
    return [
        {
            "id": str(a.id),
            "email": a.email,
            "name": a.name,
            "role": a.role.value,
            "is_active": a.is_active,
            "created_at": a.created_at.isoformat(),
        }
        for a in admins
    ]


@router.post("/admins", status_code=status.HTTP_201_CREATED)
async def create_admin(
    email: str,
    password: str,
    name: str,
    role: str = "admin",
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_super_admin)
):
    """Create a new admin user (super admin only)"""
    from ..models.admin import AdminRole
    
    # Check if admin already exists
    existing = db.query(Admin).filter(Admin.email == email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Admin with this email already exists"
        )
    
    # Validate role
    try:
        admin_role = AdminRole(role)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {[r.value for r in AdminRole]}"
        )
    
    # Create new admin
    new_admin = Admin(
        email=email,
        hashed_password=get_password_hash(password),
        name=name,
        role=admin_role,
        is_active=True,
    )
    
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    
    return {
        "id": str(new_admin.id),
        "email": new_admin.email,
        "name": new_admin.name,
        "role": new_admin.role.value,
        "message": "Admin created successfully"
    }


@router.delete("/admins/{admin_id}")
async def delete_admin(
    admin_id: str,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_super_admin)
):
    """Delete an admin user (super admin only)"""
    # Cannot delete self
    if str(current_admin.id) == admin_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own admin account"
        )
    
    admin_to_delete = db.query(Admin).filter(Admin.id == admin_id).first()
    if not admin_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin not found"
        )
    
    db.delete(admin_to_delete)
    db.commit()
    
    return {"message": "Admin deleted successfully"}
