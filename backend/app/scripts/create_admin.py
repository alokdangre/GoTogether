"""
Script to create an initial admin user for the GoTogether platform.
Run this script once to create the first admin account.

Usage:
    python -m app.scripts.create_admin
"""

import asyncio
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.auth import get_password_hash
from app.models.admin import Admin, AdminRole


async def create_admin():
    """Create an admin user"""
    db: Session = SessionLocal()
    
    try:
        # Check if admin already exists
        existing_admin = db.query(Admin).filter(Admin.email == "admin@gotogether.com").first()
        
        if existing_admin:
            print("✅ Admin user already exists!")
            # Ensure role is correct (fix for legacy data)
            if existing_admin.role != AdminRole.SUPER_ADMIN:
                print("Updating admin role to SUPER_ADMIN...")
                existing_admin.role = AdminRole.SUPER_ADMIN
                db.commit()
                print("✅ Admin role updated!")
            
            print(f"   Email: {existing_admin.email}")
            return
        
        # Create new admin
        admin = Admin(
            email="admin@gotogether.com",
            hashed_password=get_password_hash("admin123"),
            name="Admin User",
            role=AdminRole.SUPER_ADMIN,
            is_active=True,
            is_super_admin=True
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print("✅ Admin user created successfully!")
        print(f"   Email: {admin.email}")
        print(f"   Password: admin123")
        print("\n⚠️  IMPORTANT: Change this password immediately after first login!")
        
    except Exception as e:
        print(f"❌ Error creating admin: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(create_admin())
