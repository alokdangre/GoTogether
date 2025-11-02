from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List

from ..core.database import get_db
from ..core.auth import get_current_user, require_driver_user
from ..models.user import User
from ..models.trip import Trip, TripMember, MemberStatus
from ..models.payment import Payment, PaymentSplit, PaymentStatus, PaymentGateway, SplitStatus
from ..schemas.payment import PaymentCreate, Payment as PaymentSchema, PaymentSplit as PaymentSplitSchema

router = APIRouter(prefix="/api/payment", tags=["Payment"])


@router.post("/split", response_model=PaymentSplitSchema, status_code=status.HTTP_201_CREATED)
async def create_payment_split(
    payment_data: PaymentCreate,
    current_driver: User = Depends(require_driver_user),
    db: Session = Depends(get_db)
):
    """Calculate and initiate payment split for a trip"""
    trip = db.query(Trip).filter(Trip.id == payment_data.trip_id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    
    # Only driver can initiate payment
    if trip.driver_id != current_driver.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only trip driver can initiate payment"
        )
    
    # Check if payment already exists
    existing_payment = db.query(Payment).filter(Payment.trip_id == trip.id).first()
    if existing_payment:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Payment already exists for this trip"
        )
    
    # Get all approved passenger members
    approved_members = db.query(TripMember).filter(
        and_(
            TripMember.trip_id == trip.id,
            TripMember.status == MemberStatus.APPROVED
        )
    ).all()

    all_passengers = [member.user for member in approved_members]
    total_participants = len(all_passengers)

    if total_participants == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No participants to split payment with"
        )
    
    # Calculate split amount
    amount_per_person = payment_data.total_fare / total_participants
    
    # Determine payment gateway (prefer Razorpay for INR)
    gateway = PaymentGateway.RAZORPAY if payment_data.currency == "INR" else PaymentGateway.STRIPE
    
    # Create payment record
    payment = Payment(
        trip_id=trip.id,
        total_fare=payment_data.total_fare,
        currency=payment_data.currency,
        status=PaymentStatus.PENDING,
        gateway=gateway
    )
    
    db.add(payment)
    db.commit()
    db.refresh(payment)
    
    # Create payment splits
    splits = []
    for participant in all_passengers:
        split = PaymentSplit(
            payment_id=payment.id,
            user_id=participant.id,
            amount=amount_per_person,
            status=SplitStatus.PENDING
        )
        db.add(split)
        splits.append(split)
    
    db.commit()
    
    # Refresh splits with user data
    for split in splits:
        db.refresh(split)
    
    # Generate checkout URL (mocked for development)
    checkout_url = f"https://checkout.{gateway.value}.com/pay/{payment.id}"
    
    return PaymentSplitSchema(
        payment=PaymentSchema.from_orm(payment),
        splits=[{
            "user_id": split.user_id,
            "user": split.user,
            "amount": split.amount,
            "status": split.status
        } for split in splits],
        checkout_url=checkout_url
    )


@router.post("/{payment_id}/webhook")
async def payment_webhook(
    payment_id: str,
    webhook_data: dict,
    db: Session = Depends(get_db)
):
    """Handle payment gateway webhook"""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    # In production, verify webhook signature here
    # For now, we'll just simulate payment completion
    
    # Update payment status based on webhook
    if webhook_data.get("status") == "completed":
        payment.status = PaymentStatus.COMPLETED
        payment.gateway_payment_id = webhook_data.get("payment_id")
        
        # Update all splits to paid
        splits = db.query(PaymentSplit).filter(PaymentSplit.payment_id == payment.id).all()
        for split in splits:
            split.status = SplitStatus.PAID
    
    elif webhook_data.get("status") == "failed":
        payment.status = PaymentStatus.FAILED
        
        # Update all splits to failed
        splits = db.query(PaymentSplit).filter(PaymentSplit.payment_id == payment.id).all()
        for split in splits:
            split.status = SplitStatus.FAILED
    
    db.commit()
    
    return {"status": "processed"}
