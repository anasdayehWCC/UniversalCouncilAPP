"""Add transcription_feedback table for diarization quality loop

Revision ID: e5f1a0c5a9ab
Revises: d4c3f2a1b6ef
Create Date: 2025-11-21 00:08:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e5f1a0c5a9ab"
down_revision: Union[str, None] = "d4c3f2a1b6ef"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "transcription_feedback",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_datetime", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_datetime", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("transcription_id", sa.UUID(), nullable=False),
        sa.Column("organisation_id", sa.UUID(), nullable=False),
        sa.Column("service_domain_id", sa.UUID(), nullable=True),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("wer", sa.Float(), nullable=True),
        sa.Column("der", sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(["transcription_id"], ["transcription.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["organisation_id"], ["organisation.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["service_domain_id"], ["service_domain.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_transcription_feedback_transcription_id",
        "transcription_feedback",
        ["transcription_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_transcription_feedback_transcription_id", table_name="transcription_feedback")
    op.drop_table("transcription_feedback")
