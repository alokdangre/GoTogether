from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from ..models.user import User

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

# Email verification (mock)


class MockEmailVerificationService:
    """Mock email verification service for development/testing."""

    def __init__(self):
        self._pending_tokens = {}

    async def send_token(self, email: str) -> str:
        token = f"email_{datetime.utcnow().timestamp()}"
        self._pending_tokens[token] = {
            "email": email,
            "expires_at": datetime.utcnow() + timedelta(minutes=10),
        }
        print(f"[MOCK] Email verification token for {email}: {token}")
        return token

    async def verify_token(self, email: str, token: str) -> bool:
        data = self._pending_tokens.get(token)
        if not data:
            return False
        if data["email"].lower() != email.lower():
            return False
        if datetime.utcnow() > data["expires_at"]:
            del self._pending_tokens[token]
            return False
        del self._pending_tokens[token]
        return True


# JWT token security
security = HTTPBearer()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def verify_token(token: str) -> Optional[str]:
    """Verify JWT token and return user phone"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        phone: str = payload.get("sub")
        if phone is None:
            return None
        return phone
    except JWTError:
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    phone = verify_token(credentials.credentials)
    if phone is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.phone == phone).first()
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    return user


# Mock OTP service for development
class MockOTPService:
    """Mock OTP service for development and testing"""
    
    def __init__(self):
        self._pending_otps = {}  # In production, use Redis
    
    async def send_otp(self, phone: str) -> str:
        """Send OTP to phone number (mocked)"""
        request_id = f"req_{datetime.utcnow().timestamp()}"
        
        # In development, always use the same OTP
        if settings.otp_mock_enabled:
            otp = settings.otp_mock_code
        else:
            # In production, generate random OTP and send via SMS
            import random
            otp = str(random.randint(100000, 999999))
        
        # Store OTP with expiration (5 minutes)
        self._pending_otps[request_id] = {
            "phone": phone,
            "otp": otp,
            "expires_at": datetime.utcnow() + timedelta(minutes=5)
        }
        
        # In production, send SMS here
        print(f"[MOCK] OTP for {phone}: {otp}")
        
        return request_id
    
    async def verify_otp(self, request_id: str, phone: str, otp: str) -> bool:
        """Verify OTP code"""
        if request_id not in self._pending_otps:
            return False
        
        stored = self._pending_otps[request_id]
        
        # Check if expired
        if datetime.utcnow() > stored["expires_at"]:
            del self._pending_otps[request_id]
            return False
        
        # Check if phone and OTP match
        if stored["phone"] != phone or stored["otp"] != otp:
            return False
        
        # Clean up used OTP
        del self._pending_otps[request_id]
        return True


# Global service instances
otp_service = MockOTPService()
email_verification_service = MockEmailVerificationService()
