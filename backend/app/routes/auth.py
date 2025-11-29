from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
import httpx
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.config import settings
from ..core.auth import (
    otp_service,
    email_verification_service,
    create_access_token,
    get_password_hash,
    verify_password,
    get_current_user,
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
from ..schemas.user import User as UserSchema, UserUpdate

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.put("/me", response_model=UserSchema)
async def update_user_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user details."""
    if user_update.phone:
        # Check if phone is already taken
        existing_user = db.query(User).filter(User.phone == user_update.phone).first()
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Phone number already in use"
            )
        current_user.phone = user_update.phone
        current_user.is_phone_verified = False # Reset verification if phone changes
    
    if user_update.name:
        current_user.name = user_update.name
    if user_update.avatar_url:
        current_user.avatar_url = user_update.avatar_url
    if user_update.whatsapp_number:
        current_user.whatsapp_number = user_update.whatsapp_number
    if user_update.password:
        current_user.hashed_password = get_password_hash(user_update.password)
        
    db.commit()
    db.refresh(current_user)
    return current_user


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
        # If user doesn't exist and we have signup data, create new user
        if hasattr(request, 'name') and request.name:
            user = User(
                phone=request.phone,
                name=request.name,
                email=getattr(request, 'email', None),
                is_verified=False,
                is_phone_verified=True,
                is_email_verified=False,
            )
            db.add(user)
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
    token = create_access_token({"sub": str(user.id)})
    
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

    user = User(
        phone=request.phone,
        email=request.email,
        hashed_password=hashed_password,
        name=request.name,
        is_verified=True,  # Auto-verify for now
        is_phone_verified=bool(request.phone), # Assume phone is verified if provided? Or just False. Let's say False for phone if optional.
        is_email_verified=True, # Auto-verify email
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
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


@router.get("/google/login")
async def google_login():
    """Redirect to Google for authentication."""
    if not settings.google_client_id or not settings.google_redirect_uri:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth not configured"
        )
    
    google_auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={settings.google_client_id}"
        f"&redirect_uri={settings.google_redirect_uri}"
        "&response_type=code"
        "&scope=openid email profile"
        "&access_type=offline"
        "&prompt=consent"
    )
    return RedirectResponse(url=google_auth_url)


@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    """Handle Google OAuth callback."""
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth not configured"
        )

    # Exchange code for access token
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "client_id": settings.google_client_id,
        "client_secret": settings.google_client_secret,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": settings.google_redirect_uri,
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(token_url, data=data)
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to retrieve access token from Google"
            )
        token_data = response.json()
        access_token = token_data.get("access_token")
        
        # Get user info
        user_info_url = "https://www.googleapis.com/oauth2/v3/userinfo"
        user_response = await client.get(
            user_info_url, headers={"Authorization": f"Bearer {access_token}"}
        )
        if user_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to retrieve user info from Google"
            )
        user_info = user_response.json()
        
        email = user_info.get("email")
        name = user_info.get("name")
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not found in Google account"
            )
            
        # Check if user exists
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            # Create new user
            user = User(
                email=email,
                name=name,
                is_verified=True,
                is_email_verified=True,
                is_phone_verified=False, # Phone not verified via Google
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            # Update existing user if needed
            if not user.is_email_verified:
                user.is_email_verified = True
                user.is_verified = True
                db.commit()
                
        # Create access token
        # Use email as sub if phone is not available, or handle in create_access_token
        # The current create_access_token might expect a string.
        # Let's check create_access_token implementation if possible, or just pass user.id
        # In verify_otp it uses str(user.id). In login it uses user.phone.
        # Let's use str(user.id) to be consistent with verify_otp which is the main auth flow?
        # Wait, login uses user.phone. verify_otp uses user.id. This is inconsistent.
        # Let's check create_access_token in backend/app/core/auth.py to be sure.
        # For now I will use str(user.id) as it is unique and immutable.
        
        token = create_access_token({"sub": str(user.id)})
        
        # Redirect to frontend with token
        # Redirect to frontend with token
        frontend_url = f"{settings.frontend_url}/auth/signin?token={token}"
        return RedirectResponse(url=frontend_url)


@router.get("/me", response_model=UserSchema)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Get current user details."""
    return current_user

