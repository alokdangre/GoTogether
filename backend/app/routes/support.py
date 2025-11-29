from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from ..core.database import get_db
from ..core.auth import get_current_user, get_current_admin
from ..models.support import SupportRequest
from ..models.user import User
from ..models.admin import Admin

router = APIRouter(prefix="/api/support", tags=["Support"])

class SupportCreate(BaseModel):
    type: str # issue, feature, call
    title: Optional[str] = None
    description: Optional[str] = None

class SupportResponse(BaseModel):
    id: str
    type: str
    title: Optional[str]
    description: Optional[str]
    status: str
    created_at: str
    user_name: Optional[str] = None
    user_phone: Optional[str] = None

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_support_request(
    request: SupportCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    new_request = SupportRequest(
        user_id=user.id,
        type=request.type,
        title=request.title,
        description=request.description,
        status="pending"
    )
    
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    
    return {"message": "Request submitted successfully", "id": str(new_request.id)}

# Admin endpoints
@router.get("/admin/requests", response_model=List[SupportResponse])
async def list_support_requests(
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    requests = db.query(SupportRequest).join(User).order_by(SupportRequest.created_at.desc()).all()
    
    result = []
    for req in requests:
        result.append({
            "id": str(req.id),
            "type": req.type,
            "title": req.title,
            "description": req.description,
            "status": req.status,
            "created_at": req.created_at.isoformat(),
            "user_name": req.user.name if req.user else "Unknown",
            "user_phone": req.user.phone if req.user else "Unknown"
        })
    return result

@router.patch("/admin/requests/{request_id}")
async def update_support_status(
    request_id: str,
    status: str,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    req = db.query(SupportRequest).filter(SupportRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    req.status = status
    db.commit()
    return {"message": "Status updated"}
