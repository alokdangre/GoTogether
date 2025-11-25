from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.config import settings
from ..core.auth import (
    otp_service,
    email_verification_service,
    create_access_token,
    get_password_hash,
    verify_password,
)
from ..models.user import User, UserRole
from ..models.driver import Driver
from ..models.rider import Rider
from ..schemas.auth import (
    OTPRequest,
    OTPVerify,
    SignUpRequest,
    LoginRequest,
    EmailVerificationRequest,
    EmailVerificationVerify,
    Token,
)
from ..schemas.user import User as UserSchema

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/otp", response_model=dict)
async def send_otp(request: OTPRequest, db: Session = Depends(get_db)):
    """Send OTP to phone number for authentication"""
    try:
        request_id = await otp_service.send_otp(request.phone)
        return {
            "message": f"OTP sent to {request.phone}",
            "request_id": request_id
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP"
        )


@router.post("/verify", response_model=Token)
async def verify_otp(request: OTPVerify, db: Session = Depends(get_db)):
    """Verify OTP and complete authentication."""
    # Check if OTP is valid
    is_valid = await otp_service.verify_otp(request.request_id, request.phone, request.otp)
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP"
        )

    # Check if user exists
    user = db.query(User).filter(User.phone == request.phone).first()

    if not user:
        # If user doesn't exist and we have signup data, create new user as RIDER
        if hasattr(request, 'name') and request.name:
            user = User(
                phone=request.phone,
                name=request.name,
                email=getattr(request, 'email', None),
                role=UserRole.RIDER,  # Always create as RIDER
                is_verified=False,
                is_phone_verified=True,
                is_email_verified=False,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            # Always create Rider profile for new signups
            rider_profile = Rider(id=user.id)
            db.add(rider_profile)

            db.commit()
            db.refresh(user)
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found. Please provide signup information."
            )
    else:
        # Update verification status for existing user
        user.is_phone_verified = True
        user.is_verified = user.is_phone_verified or user.is_email_verified
        db.commit()
    
    # Create access token
    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    
    return Token(
        access_token=token,
        user=UserSchema.from_orm(user)
    )


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
async def signup(request: SignUpRequest, db: Session = Depends(get_db)):
    """Sign up with phone/email and password (password-based auth)."""
    if not request.phone and not request.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone or email is required"
        )

    existing_user = None
    if request.phone:
        existing_user = db.query(User).filter(User.phone == request.phone).first()
    if not existing_user and request.email:
        existing_user = db.query(User).filter(User.email == request.email).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already exists"
        )

    hashed_password = get_password_hash(request.password)
    role = request.role or UserRole.RIDER

    user = User(
        phone=request.phone,
        email=request.email,
        hashed_password=hashed_password,
        name=request.name,
        role=role,
        is_verified=False,
        is_phone_verified=False,
        is_email_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create role-specific profiles
    if role in (UserRole.DRIVER, UserRole.BOTH):
        driver_profile = Driver(id=user.id)
        db.add(driver_profile)
    if role in (UserRole.RIDER, UserRole.BOTH):
        rider_profile = Rider(id=user.id)
        db.add(rider_profile)

    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return Token(access_token=token, user=UserSchema.from_orm(user))


@router.post("/email/send", response_model=dict)
async def send_email_verification(
    request: EmailVerificationRequest,
    db: Session = Depends(get_db),
):
    """Send an email verification token to the user's email."""
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with this email does not exist",
        )

    token = await email_verification_service.send_token(request.email)

    response = {"message": f"Verification email sent to {request.email}"}
    if settings.debug:
        # In development, surface the token for convenience
        response["debug_token"] = token
    return response


@router.post("/email/verify", response_model=dict)
async def verify_email_token(
    request: EmailVerificationVerify,
    db: Session = Depends(get_db),
):
    """Verify an email using the token issued via /email/send."""
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with this email does not exist",
        )

    is_valid = await email_verification_service.verify_token(request.email, request.token)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token",
        )

    user.is_email_verified = True
    user.is_verified = user.is_phone_verified or user.is_email_verified
    db.commit()

    return {"message": "Email verified successfully"}


@router.post("/login", response_model=Token)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login using phone/email and password."""
    if not request.phone and not request.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone or email is required"
        )

    query = db.query(User)
    if request.phone:
        query = query.filter(User.phone == request.phone)
    else:
        query = query.filter(User.email == request.email)

    user = query.first()
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    token = create_access_token({"sub": user.phone})
    return Token(access_token=token, user=UserSchema.from_orm(user))
