"""rename admin full_name to name

Revision ID: b1c2d3e4f5g6
Revises: aee12e345291
Create Date: 2025-11-28 19:15:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b1c2d3e4f5g6'
down_revision = '9b828df5dbe9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column('admins', 'full_name', new_column_name='name')


def downgrade() -> None:
    op.alter_column('admins', 'name', new_column_name='full_name')
