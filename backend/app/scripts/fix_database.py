"""
Script to fix database migration issues and create admin table.
This script will:
1. Delete orphaned driver records
2. Create the admins table if it doesn't exist
3. Run pending migrations
"""

import asyncio
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, engine
from app.models.base import BaseModel


async def fix_database():
    """Fix database migration issues"""
    db: Session = SessionLocal()
    
    try:
        print("🔧 Fixing database migration issues...")
        
        # Step 1: Delete orphaned driver records
        print("\n1️⃣  Deleting orphaned driver records...")
        result = db.execute(text("""
            DELETE FROM drivers 
            WHERE id NOT IN (SELECT id FROM users)
        """))
        db.commit()
        print(f"   ✅ Deleted {result.rowcount} orphaned driver records")
        
        # Step 2: Create admins table if it doesn't exist
        print("\n2️⃣  Creating admins table...")
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS admins (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                hashed_password VARCHAR(255) NOT NULL,
                name VARCHAR(100) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE
            );
        """))
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_admins_email ON admins(email);
        """))
        db.commit()
        print("   ✅ Admins table created successfully")
        
        print("\n✅ Database migration fix completed!")
        print("\nNext step: Run 'python3 -m app.scripts.create_admin' to create admin user")
        
    except Exception as e:
        print(f"\n❌ Error fixing database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(fix_database())
