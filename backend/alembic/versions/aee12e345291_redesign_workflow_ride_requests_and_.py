"""redesign_workflow_ride_requests_and_grouped_rides

Revision ID: aee12e345291
Revises: 06c0461f2853
Create Date: 2025-11-27 09:49:17.309302

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'aee12e345291'
down_revision = '06c0461f2853'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop foreign key constraints first
    op.drop_constraint('chat_messages_trip_id_fkey', 'chat_messages', type_='foreignkey')
    op.drop_constraint('payments_trip_id_fkey', 'payments', type_='foreignkey')
    op.drop_constraint('ratings_trip_id_fkey', 'ratings', type_='foreignkey')
    
    # Drop old tables in correct order
    op.drop_table('trip_members')
    op.drop_table('trips')
    op.drop_table('riders')
    
    # Drop chat_messages and payments as they're trip-specific
    op.drop_table('chat_messages')
    op.drop_table('payment_splits')  # Drop payment_splits before payments
    op.drop_table('payments')
    
    # Update users table - remove role, add new fields
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS role")
    op.add_column('users', sa.Column('whatsapp_number', sa.String(20), nullable=True))
    op.add_column('users', sa.Column('total_rides', sa.Integer(), server_default='0', nullable=False))
    op.add_column('users', sa.Column('total_savings', sa.Float(), server_default='0.0', nullable=False))
    
    # Rename total_trips to match (if it exists)
    try:
        op.alter_column('users', 'total_trips', new_column_name='total_rides_old')
        op.drop_column('users', 'total_rides_old')
    except:
        pass  # Column might not exist
    
    # Drop and recreate drivers table as standalone (not linked to users)
    op.drop_table('drivers')
    op.create_table(
        'drivers',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('phone', sa.String(20), nullable=False),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('license_number', sa.String(50), nullable=True),
        sa.Column('license_document_url', sa.String(500), nullable=True),
        sa.Column('vehicle_type', sa.String(20), nullable=True),
        sa.Column('vehicle_make', sa.String(100), nullable=True),
        sa.Column('vehicle_model', sa.String(100), nullable=True),
        sa.Column('vehicle_color', sa.String(50), nullable=True),
        sa.Column('vehicle_plate_number', sa.String(20), nullable=True),
        sa.Column('vehicle_document_url', sa.String(500), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('is_verified', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('availability_status', sa.String(20), server_default='available', nullable=False),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deactivated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('rating', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('total_rides', sa.Integer(), server_default='0', nullable=False),
        sa.Column('assigned_rides_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('total_ratings', sa.Integer(), server_default='0', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('phone'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('license_number'),
        sa.UniqueConstraint('vehicle_plate_number')
    )
    
    # Create ride_requests table
    op.create_table(
        'ride_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('source_lat', sa.Float(), nullable=False),
        sa.Column('source_lng', sa.Float(), nullable=False),
        sa.Column('source_address', sa.String(500), nullable=True),
        sa.Column('destination_lat', sa.Float(), nullable=False),
        sa.Column('destination_lng', sa.Float(), nullable=False),
        sa.Column('destination_address', sa.String(500), nullable=False),
        sa.Column('is_railway_station', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('train_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('requested_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('passenger_count', sa.Integer(), server_default='1', nullable=False),
        sa.Column('additional_info', sa.Text(), nullable=True),
        sa.Column('status', sa.String(20), server_default='pending', nullable=False),
        sa.Column('grouped_ride_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_ride_requests_status', 'ride_requests', ['status'])
    op.create_index('ix_ride_requests_user_id', 'ride_requests', ['user_id'])
    
    # Create grouped_rides table
    op.create_table(
        'grouped_rides',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('admin_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('driver_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('destination_address', sa.String(500), nullable=False),
        sa.Column('pickup_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('pickup_location', sa.String(500), nullable=True),
        sa.Column('actual_price', sa.Float(), nullable=True),
        sa.Column('charged_price', sa.Float(), nullable=True),
        sa.Column('status', sa.String(20), server_default='pending_acceptance', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['admin_id'], ['admins.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['driver_id'], ['drivers.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_grouped_rides_status', 'grouped_rides', ['status'])
    
    # Add foreign key from ride_requests to grouped_rides
    op.create_foreign_key('ride_requests_grouped_ride_id_fkey', 'ride_requests', 'grouped_rides', ['grouped_ride_id'], ['id'], ondelete='SET NULL')
    
    # Create ride_notifications table
    op.create_table(
        'ride_notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('grouped_ride_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('notification_type', sa.String(50), nullable=False),
        sa.Column('status', sa.String(20), server_default='pending', nullable=False),
        sa.Column('sent_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('responded_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['grouped_ride_id'], ['grouped_rides.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_ride_notifications_status', 'ride_notifications', ['status'])
    op.create_index('ix_ride_notifications_user_id', 'ride_notifications', ['user_id'])
    
    # Drop and recreate ratings table
    op.drop_table('ratings')
    op.create_table(
        'ratings',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('driver_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('grouped_ride_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('testimonial_text', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['driver_id'], ['drivers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['grouped_ride_id'], ['grouped_rides.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Update admins table
    op.add_column('admins', sa.Column('is_super_admin', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('admins', sa.Column('last_login', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    # This is a major redesign - downgrade not fully supported
    # Would need to recreate trips, trip_members, riders tables
    pass
