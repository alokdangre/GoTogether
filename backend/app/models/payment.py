from sqlalchemy import Column, String, Float, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum
from .base import BaseModel


class PaymentStatus(PyEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class PaymentGateway(PyEnum):
    RAZORPAY = "razorpay"
    STRIPE = "stripe"


class SplitStatus(PyEnum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"


class Payment(BaseModel):
    __tablename__ = "payments"
    
    grouped_ride_id = Column(UUID(as_uuid=True), ForeignKey("grouped_rides.id"), nullable=False, unique=True)
    total_fare = Column(Float, nullable=False)
    currency = Column(String(3), default="INR")
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    gateway = Column(Enum(PaymentGateway), nullable=False)
    gateway_payment_id = Column(String(100), nullable=True)
    gateway_order_id = Column(String(100), nullable=True)
    
    # Relationships
    grouped_ride = relationship("GroupedRide", back_populates="payment")
    splits = relationship("PaymentSplit", back_populates="payment", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Payment(grouped_ride_id={self.grouped_ride_id}, total_fare={self.total_fare}, status={self.status})>"


class PaymentSplit(BaseModel):
    __tablename__ = "payment_splits"
    
    payment_id = Column(UUID(as_uuid=True), ForeignKey("payments.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(Enum(SplitStatus), default=SplitStatus.PENDING)
    gateway_transfer_id = Column(String(100), nullable=True)
    
    # Relationships
    payment = relationship("Payment", back_populates="splits")
    user = relationship("User")
    
    def __repr__(self):
        return f"<PaymentSplit(payment_id={self.payment_id}, user_id={self.user_id}, amount={self.amount})>"
