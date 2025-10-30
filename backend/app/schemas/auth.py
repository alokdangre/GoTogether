from pydantic import BaseModel, Field
from typing import Optional
from .user import User


class OTPRequest(BaseModel):
    phone: str = Field(..., pattern=r'^\+[1-9]\d{1,14}$')


class OTPVerify(BaseModel):
    phone: str = Field(..., pattern=r'^\+[1-9]\d{1,14}$')
    otp: str = Field(..., min_length=4, max_length=6)
    request_id: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User
