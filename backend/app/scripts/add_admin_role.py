"""
Script to add role column to admins table and set existing admin as super admin.
"""

import asyncio
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import SessionLocal


async def add_admin_role():
    """Add role column to admins table"""
    db: Session = SessionLocal()
    
    try:
        print("🔧 Adding role column to admins table...")
        
        # Add role column
        db.execute(text("""
            ALTER TABLE admins 
            ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'admin';
        """))
        db.commit()
        print("   ✅ Role column added")
        
        # Set existing admin as super admin
        print("\n🔧 Setting existing admin as super admin...")
        db.execute(text("""
            UPDATE admins 
            SET role = 'super_admin' 
            WHERE email = 'admin@gotogether.com';
        """))
        db.commit()
        print("   ✅ Admin role updated to super_admin")
        
        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(add_admin_role())
