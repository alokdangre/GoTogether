from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from .user import User


class OTPRequest(BaseModel):
    phone: str = Field(..., pattern=r'^\+[1-9]\d{1,14}$')


class OTPVerify(BaseModel):
    phone: str = Field(..., pattern=r'^\+[1-9]\d{1,14}$')
    otp: str = Field(..., min_length=4, max_length=6)
    request_id: str


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
