import secrets
from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .email import EmailDeliveryError, send_email
from ..models.user import User
from ..models.driver import Driver

# Password hashing (PBKDF2-SHA256 avoids bcrypt backend issues/length limits)
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def get_password_hash(password: str) -> str:
    """Hash a password using PBKDF2-SHA256"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a PBKDF2-SHA256 hash"""
    return pwd_context.verify(plain_password, hashed_password)

# Email verification


class EmailVerificationService:
    """Email verification token management and delivery."""

    def __init__(self):
        self._pending_tokens: dict[str, dict[str, datetime]] = {}

    async def send_token(self, email: str) -> str:
        token = secrets.token_urlsafe(16)
        expires_at = datetime.utcnow() + timedelta(minutes=30)

        subject = "Verify your email for GoTogether"
        verification_code = token
        text_body = (
            "Thanks for signing up for GoTogether!\n\n"
            f"Use the verification code below within 30 minutes to confirm your email address:\n\n"
            f"    {verification_code}\n\n"
            "If you did not request this, you can safely ignore this email."
        )
        html_body = (
            "<p>Thanks for signing up for GoTogether!</p>"
            "<p>Use the verification code below within 30 minutes to confirm your email address:</p>"
            f"<p style=\"font-size:18px;font-weight:bold;letter-spacing:2px;\">{verification_code}</p>"
            "<p>If you did not request this, you can safely ignore this email.</p>"
        )

        try:
            await send_email(email, subject, text_body, html_body)
        except EmailDeliveryError as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send verification email",
            ) from exc

        self._pending_tokens[token] = {
            "email": email.lower(),
            "expires_at": expires_at,
        }
        return token

    async def verify_token(self, email: str, token: str) -> bool:
        data = self._pending_tokens.get(token)
        if not data:
            return False

        if data["email"] != email.lower():
            return False

        if datetime.utcnow() > data["expires_at"]:
            del self._pending_tokens[token]
            return False

        del self._pending_tokens[token]
        return True


# JWT token security
security = HTTPBearer()
driver_security = HTTPBearer()


def _create_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)

    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token for riders/users"""
    to_encode = data.copy()
    to_encode.setdefault("scope", "user")
    return _create_token(to_encode, expires_delta)


def create_driver_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token for drivers"""
    to_encode = data.copy()
    to_encode.setdefault("scope", "driver")
    return _create_token(to_encode, expires_delta)


def verify_token(token: str) -> Optional[str]:
    """Verify JWT token and return user phone"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        scope = payload.get("scope", "user")
        if scope != "user":
            return None
        phone: str = payload.get("sub")
        if phone is None:
            return None
        return phone
    except JWTError:
        return None


def verify_driver_token(token: str) -> Optional[str]:
    """Verify driver JWT token and return driver ID"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        if payload.get("scope") != "driver":
            return None
        driver_id: str = payload.get("sub")
        if driver_id is None:
            return None
        return driver_id
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


async def get_current_driver(
    credentials: HTTPAuthorizationCredentials = Depends(driver_security),
    db: Session = Depends(get_db)
) -> Driver:
    """Get current authenticated driver from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    driver_id = verify_driver_token(credentials.credentials)
    if driver_id is None:
        raise credentials_exception

    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if driver is None:
        raise credentials_exception

    if not driver.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive driver"
        )

    return driver


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
email_verification_service = EmailVerificationService()
