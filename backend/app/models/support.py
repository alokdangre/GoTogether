from sqlalchemy import Column, String, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from .base import BaseModel

class SupportRequest(BaseModel):
    __tablename__ = "support_requests"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    type = Column(String(20), nullable=False) # issue, feature, call
    title = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="pending") # pending, in_progress, resolved, rejected
    
    # Relationships
    user = relationship("User", back_populates="support_requests")
    
    def __repr__(self):
        return f"<SupportRequest(id={self.id}, type={self.type}, user_id={self.user_id})>"
