"""add_railway_station_trip_fields

Revision ID: f5g6h7i8j9k0
Revises: e693e7f12cc4
Create Date: 2025-11-30 09:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'f5g6h7i8j9k0'
down_revision = 'e693e7f12cc4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns to grouped_rides table
    op.add_column('grouped_rides', sa.Column('total_seats', sa.Integer(), nullable=False, server_default='4'))
    op.add_column('grouped_rides', sa.Column('is_railway_station_trip', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('grouped_rides', sa.Column('auto_created', sa.Boolean(), nullable=False, server_default='false'))
    
    # Create index for railway station trips for faster lookups
    op.create_index('idx_grouped_rides_railway_station', 'grouped_rides', ['is_railway_station_trip', 'pickup_time'])


def downgrade() -> None:
    # Drop index
    op.drop_index('idx_grouped_rides_railway_station', table_name='grouped_rides')
    
    # Drop columns
    op.drop_column('grouped_rides', 'auto_created')
    op.drop_column('grouped_rides', 'is_railway_station_trip')
    op.drop_column('grouped_rides', 'total_seats')
