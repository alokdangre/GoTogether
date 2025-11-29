"""create_system_notifications_table

Revision ID: e693e7f12cc4
Revises: e4f5g6h7i8j9
Create Date: 2025-11-29 16:56:41.182336

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'e693e7f12cc4'
down_revision = 'e4f5g6h7i8j9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create system_notifications table
    op.create_table(
        'system_notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('is_read', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )
    
    # Create indexes for better query performance
    op.create_index('idx_system_notifications_user_id', 'system_notifications', ['user_id'])
    op.create_index('idx_system_notifications_is_read', 'system_notifications', ['is_read'])
    op.create_index('idx_system_notifications_created_at', 'system_notifications', ['created_at'], postgresql_ops={'created_at': 'DESC'})


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_system_notifications_created_at', table_name='system_notifications')
    op.drop_index('idx_system_notifications_is_read', table_name='system_notifications')
    op.drop_index('idx_system_notifications_user_id', table_name='system_notifications')
    
    # Drop table
    op.drop_table('system_notifications')
