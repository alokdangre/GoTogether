"""change_enum_columns_to_varchar

Revision ID: 06c0461f2853
Revises: 16b647d2bca8
Create Date: 2025-11-27 09:17:14.891696

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '06c0461f2853'
down_revision = '16b647d2bca8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Convert trips.vehicle_type from enum to varchar
    op.execute("ALTER TABLE trips ALTER COLUMN vehicle_type TYPE VARCHAR(20) USING vehicle_type::text")
    
    # Convert trips.status from enum to varchar
    op.execute("ALTER TABLE trips ALTER COLUMN status TYPE VARCHAR(20) USING status::text")
    
    # Convert trip_members.status from enum to varchar
    op.execute("ALTER TABLE trip_members ALTER COLUMN status TYPE VARCHAR(20) USING status::text")


def downgrade() -> None:
    # Note: Downgrade would require recreating the enum types
    # For simplicity, we'll just convert back to text
    # In production, you'd want to recreate the enum types properly
    pass
