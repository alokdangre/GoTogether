from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.auth import otp_service, create_access_token
from ..models.user import User
from ..schemas.auth import OTPRequest, OTPVerify, Token
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
        user = User(phone=request.phone, is_verified=True)
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update verification status
        user.is_verified = True
        db.commit()
    
    # Create access token
    access_token = create_access_token(data={"sub": user.phone})
    
    return Token(
        access_token=access_token,
        user=UserSchema.from_orm(user)
    )
