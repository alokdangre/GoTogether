"""add is_active to admins

Revision ID: c2d3e4f5g6h7
Revises: b1c2d3e4f5g6
Create Date: 2025-11-28 19:20:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c2d3e4f5g6h7'
down_revision = 'b1c2d3e4f5g6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    op.drop_column('admins', 'is_active')
