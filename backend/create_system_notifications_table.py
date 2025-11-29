"""
Migration script to create system_notifications table
Run this with: python create_system_notifications_table.py
"""
from app.core.database import engine
from sqlalchemy import text

def create_system_notifications_table():
    """Create the system_notifications table"""
    
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS system_notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE
    );
    
    -- Create index on user_id for faster queries
    CREATE INDEX IF NOT EXISTS idx_system_notifications_user_id ON system_notifications(user_id);
    
    -- Create index on is_read for filtering unread notifications
    CREATE INDEX IF NOT EXISTS idx_system_notifications_is_read ON system_notifications(is_read);
    
    -- Create index on created_at for sorting
    CREATE INDEX IF NOT EXISTS idx_system_notifications_created_at ON system_notifications(created_at DESC);
    """
    
    with engine.connect() as conn:
        conn.execute(text(create_table_sql))
        conn.commit()
        print("✅ system_notifications table created successfully!")

if __name__ == "__main__":
    create_system_notifications_table()
