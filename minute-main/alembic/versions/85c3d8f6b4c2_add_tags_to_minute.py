"""add tags to minute

Revision ID: 85c3d8f6b4c2
Revises: 
Create Date: 2025-11-25
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '85c3d8f6b4c2'
down_revision = '20a0f2c1d3ab'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('minute', sa.Column('tags', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='[]'))


def downgrade() -> None:
    op.drop_column('minute', 'tags')
