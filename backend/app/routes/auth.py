from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.auth import (
    otp_service,
    email_verification_service,
    create_access_token,
    get_password_hash,
    verify_password,
)
from ..models.user import User
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
    """Verify OTP and return JWT token"""
    # Verify OTP
    is_valid = await otp_service.verify_otp(request.request_id, request.phone, request.otp)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP"
        )
    
    # Get or create user
    user = db.query(User).filter(User.phone == request.phone).first()
    if not user:
        user = User(
            phone=request.phone,
            is_verified=True,
            is_phone_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update verification status
        user.is_phone_verified = True
        user.is_verified = user.is_phone_verified or user.is_email_verified
        db.commit()
    
    # Create access token
    access_token = create_access_token(data={"sub": user.phone})
    
    return Token(
        access_token=access_token,
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
    user = User(
        phone=request.phone,
        email=request.email,
        hashed_password=hashed_password,
        name=request.name,
        is_verified=False,
        is_phone_verified=False,
        is_email_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.phone})
    return Token(access_token=token, user=UserSchema.from_orm(user))


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
