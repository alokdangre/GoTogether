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
from ..models.user import User
from ..models.driver import Driver
from ..models.grouped_ride import GroupedRide
from ..models.ride_request import RideRequest
from ..schemas.auth import AdminLogin, AdminToken, DriverCreate
from ..schemas.grouped_ride import GroupedRideAdminCreate
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


@router.post("/drivers", status_code=status.HTTP_201_CREATED)
async def create_driver(
    request: DriverCreate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Create a new driver (admin only)"""
    # Check if driver with phone already exists
    existing_driver = db.query(Driver).filter(Driver.phone == request.phone).first()
    if existing_driver:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Driver with this phone number already exists"
        )
    
    if request.email:
        existing_email = db.query(Driver).filter(Driver.email == request.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Driver with this email already exists"
            )
    
    # Create standalone driver entity
    driver = Driver(
        phone=request.phone,
        name=request.name,
        email=request.email,
        license_number=request.license_number,
        vehicle_type=request.vehicle_type,
        vehicle_make=request.vehicle_make,
        vehicle_model=request.vehicle_model,
        vehicle_color=request.vehicle_color,
        vehicle_plate_number=request.vehicle_plate_number,
        is_verified=False,  # Needs manual verification
        is_active=True,
    )
    db.add(driver)
    db.commit()
    db.refresh(driver)
    
    return {
        "id": str(driver.id),
        "name": driver.name,
        "phone": driver.phone,
        "email": driver.email,
        "message": "Driver created successfully"
    }


@router.get("/users", response_model=List[UserSchema])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=1000),
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """List all users with pagination (admin only)"""
    query = db.query(User)
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
    limit: int = Query(50, ge=1, le=1000),
    is_verified: Optional[bool] = None,
    availability_status: Optional[str] = None,
    sort_by: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """List all drivers with pagination (admin only)"""
    query = db.query(Driver)
    
    if is_verified is not None:
        query = query.filter(Driver.is_verified == is_verified)
        
    if availability_status:
        query = query.filter(Driver.availability_status == availability_status)
        
    if sort_by == "queue":
        # Sort by assigned_rides_count ASC (fairness) and then updated_at
        query = query.order_by(Driver.assigned_rides_count.asc(), Driver.updated_at.asc())
    else:
        query = query.order_by(Driver.created_at.desc())
    
    drivers = query.offset(skip).limit(limit).all()
    
    # Return driver data
    result = []
    for driver in drivers:
        driver_data = {
            "id": str(driver.id),
            "name": driver.name,
            "phone": driver.phone,
            "email": driver.email,
            "license_number": driver.license_number,
            "vehicle_type": driver.vehicle_type,
            "vehicle_make": driver.vehicle_make,
            "vehicle_model": driver.vehicle_model,
            "vehicle_color": driver.vehicle_color,
            "vehicle_plate_number": driver.vehicle_plate_number,
            "is_verified": driver.is_verified,
            "is_active": driver.is_active,
            "availability_status": driver.availability_status,
            "rating": driver.rating,
            "total_rides": driver.total_rides,
            "assigned_rides_count": driver.assigned_rides_count,
        }
        result.append(driver_data)
    
    return result


@router.patch("/drivers/{driver_id}")
async def update_driver(
    driver_id: str,
    is_verified: Optional[bool] = None,
    is_active: Optional[bool] = None,
    availability_status: Optional[str] = None,
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
            
    if availability_status:
        driver.availability_status = availability_status
    
    db.commit()
    db.refresh(driver)
    
    return {"message": "Driver updated successfully"}


@router.get("/ride-requests")
async def list_ride_requests(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=1000),
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """List all ride requests with pagination (admin only)"""
    query = db.query(RideRequest)
    
    if status:
        query = query.filter(RideRequest.status == status)
    
    # Order by created_at desc
    query = query.order_by(RideRequest.created_at.desc())
    
    requests = query.offset(skip).limit(limit).all()
    
    result = []
    for req in requests:
        req_data = {
            "id": str(req.id),
            "user_id": str(req.user_id),
            "user_name": req.user.name if req.user else None,
            "user_phone": req.user.phone if req.user else None,
            "source_address": req.source_address,
            "destination_address": req.destination_address,
            "requested_time": req.requested_time.isoformat(),
            "passenger_count": req.passenger_count,
            "status": req.status,
            "created_at": req.created_at.isoformat(),
            "is_railway_station": req.is_railway_station,
            "train_time": req.train_time.isoformat() if req.train_time else None,
        }
        result.append(req_data)
    
    return result





@router.post("/trips/create", status_code=status.HTTP_201_CREATED)
async def create_grouped_ride(
    request: GroupedRideAdminCreate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Create a grouped ride from requests (admin only)"""
    # Verify driver exists
    driver = db.query(Driver).filter(Driver.id == request.driver_id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )
    
    # Verify requests exist and are pending
    ride_requests = db.query(RideRequest).filter(RideRequest.id.in_(request.ride_request_ids)).all()
    if len(ride_requests) != len(request.ride_request_ids):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or more ride requests not found"
        )
    
    for req in ride_requests:
        if req.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ride request {req.id} is not pending"
            )
    
    # Create GroupedRide
    grouped_ride = GroupedRide(
        admin_id=admin.id,
        driver_id=request.driver_id,
        destination_address=request.destination_address,
        pickup_time=request.pickup_time,
        pickup_location=request.pickup_location,
        charged_price=request.charged_price,
        status="pending_acceptance"
    )
    
    db.add(grouped_ride)
    db.flush() # Get ID
    
    # Update requests and create notifications
    from ..models.ride_notification import RideNotification
    
    for req in ride_requests:
        req.grouped_ride_id = grouped_ride.id
        req.status = "grouped"
        
        # Create notification for user
        notification = RideNotification(
            user_id=req.user_id,
            grouped_ride_id=grouped_ride.id,
            notification_type="ride_assignment",
            status="pending"
        )
        db.add(notification)
    
    db.commit()
    db.refresh(grouped_ride)
    
    return {"message": "Grouped ride created successfully", "id": str(grouped_ride.id)}


@router.get("/trips")
async def list_rides(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=1000),
    status: Optional[str] = None,
    date: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """List all grouped rides with pagination (admin only)"""
    query = db.query(GroupedRide)
    
    if status:
        query = query.filter(GroupedRide.status == status)
        
    if date:
        from sqlalchemy import func
        query = query.filter(func.date(GroupedRide.pickup_time) == date)
        
    query = query.order_by(GroupedRide.created_at.desc())
    
    rides = query.offset(skip).limit(limit).all()
    
    result = []
    for ride in rides:
        ride_data = {
            "id": str(ride.id),
            "driver_id": str(ride.driver_id) if ride.driver_id else None,
            "driver_name": ride.driver.name if ride.driver else None,
            "pickup_location": ride.pickup_location,
            "destination": ride.destination_address,
            "scheduled_time": ride.pickup_time.isoformat() if ride.pickup_time else None,
            "total_seats": 4,  # Default to 4 for now
            "available_seats": 4 - len(ride.ride_requests) if ride.ride_requests else 4,
            "fare_per_seat": float(ride.charged_price) if ride.charged_price else None,
            "status": ride.status,
            "created_at": ride.created_at.isoformat(),
        }
        result.append(ride_data)
    
    return result


@router.get("/trips/{ride_id}")
async def get_ride(
    ride_id: str,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Get ride details (admin only)"""
    ride = db.query(GroupedRide).filter(GroupedRide.id == ride_id).first()
    if not ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ride not found"
        )
    
    ride_data = {
        "id": str(ride.id),
        "driver_id": str(ride.driver_id) if ride.driver_id else None,
        "driver_name": ride.driver.name if ride.driver else None,
        "pickup_location": ride.pickup_location,
        "destination": ride.destination_address,
        "scheduled_time": ride.pickup_time.isoformat() if ride.pickup_time else None,
        "total_seats": 4,
        "available_seats": 4 - len(ride.ride_requests) if ride.ride_requests else 4,
        "fare_per_seat": float(ride.charged_price) if ride.charged_price else None,
        "status": ride.status,
        "created_at": ride.created_at.isoformat(),
    }
    
    return ride_data


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
