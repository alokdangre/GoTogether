from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum
import uuid

from .user import User


class PaymentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class PaymentGateway(str, Enum):
    RAZORPAY = "razorpay"
    STRIPE = "stripe"


class SplitStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"


class PaymentCreate(BaseModel):
    trip_id: uuid.UUID
    total_fare: float = Field(..., gt=0)
    currency: str = Field("INR", max_length=3)


class PaymentSplitItem(BaseModel):
    user_id: uuid.UUID
    user: User
    amount: float
    status: SplitStatus
    
    class Config:
        from_attributes = True


class Payment(BaseModel):
    id: uuid.UUID
    trip_id: uuid.UUID
    total_fare: float
    currency: str
    status: PaymentStatus
    gateway: PaymentGateway
    gateway_payment_id: Optional[str]
    gateway_order_id: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class PaymentSplit(BaseModel):
    payment: Payment
    splits: List[PaymentSplitItem]
    checkout_url: Optional[str] = None
