from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from .user import User


class OTPRequest(BaseModel):
    phone: str = Field(..., pattern=r'^\+[1-9]\d{1,14}$')


class OTPVerify(BaseModel):
    phone: str = Field(..., pattern=r'^\+[1-9]\d{1,14}$')
    otp: str = Field(..., min_length=4, max_length=6)
    request_id: str
    # Optional signup fields
    name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None


class SignUpRequest(BaseModel):
    phone: str = Field(..., pattern=r'^\+[1-9]\d{1,14}$')
    email: Optional[EmailStr] = None
    password: str = Field(..., min_length=8, max_length=128)
    name: str = Field(..., max_length=100)


class LoginRequest(BaseModel):
    phone: Optional[str] = Field(None, pattern=r'^\+[1-9]\d{1,14}$')
    email: Optional[EmailStr] = None
    password: str = Field(..., min_length=8, max_length=128)


class EmailVerificationRequest(BaseModel):
    email: EmailStr


class EmailVerificationVerify(BaseModel):
    email: EmailStr
    token: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User


# Admin schemas
class AdminLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class AdminToken(BaseModel):
    access_token: str
    token_type: str = "bearer"


class DriverCreate(BaseModel):
    phone: str = Field(..., pattern=r'^\+[1-9]\d{1,14}$')
    name: str = Field(..., max_length=100)
    email: Optional[EmailStr] = None
    license_number: Optional[str] = Field(None, max_length=100)
    vehicle_type: Optional[str] = Field(None, max_length=50)
    vehicle_make: Optional[str] = Field(None, max_length=100)
    vehicle_model: Optional[str] = Field(None, max_length=100)
    vehicle_color: Optional[str] = Field(None, max_length=50)
    vehicle_plate_number: Optional[str] = Field(None, max_length=50)
