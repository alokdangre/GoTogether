from sqlalchemy import Boolean, Column, String, Enum as SQLEnum, DateTime
from sqlalchemy.orm import relationship
import enum

from .base import BaseModel


class AdminRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"


class Admin(BaseModel):
    __tablename__ = "admins"

    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    role = Column(SQLEnum(AdminRole), default=AdminRole.ADMIN, nullable=False)
    is_active = Column(Boolean, default=True)
    is_super_admin = Column(Boolean, default=False)
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    grouped_rides = relationship("GroupedRide", back_populates="admin")

    def __repr__(self):
        return f"<Admin(email={self.email}, name={self.name}, role={self.role})>"
