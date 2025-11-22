"""Add translations column to transcription

Revision ID: 20a0f2c1d3ab
Revises: f6c1d2e4ea11_service_domain_template_and_minute_fields.py
Create Date: 2025-11-22
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20a0f2c1d3ab"
down_revision = "c2f7890abc12_add_minute_created_by.py"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "transcription",
        sa.Column(
            "translations",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
    )


def downgrade() -> None:
    op.drop_column("transcription", "translations")
