"""Add captured_offline flag to recording

Revision ID: d4c3f2a1b6ef
Revises: bb9c2d4cf7e5
Create Date: 2025-11-20 23:55:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d4c3f2a1b6ef"
down_revision: Union[str, None] = "bb9c2d4cf7e5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("recording", sa.Column("captured_offline", sa.Boolean(), server_default=sa.text("false")))
    op.add_column(
        "transcription",
        sa.Column("processing_mode", sa.String(), server_default=sa.text("'fast'"), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("transcription", "processing_mode")
    op.drop_column("recording", "captured_offline")
