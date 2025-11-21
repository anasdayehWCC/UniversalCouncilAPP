"""Add case table and context fields to minutes/transcriptions

Revision ID: bb9c2d4cf7e5
Revises: c2f7890abc12
Create Date: 2025-11-20 23:10:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "bb9c2d4cf7e5"
down_revision: Union[str, None] = "c2f7890abc12"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "case_record",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_datetime", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_datetime", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("case_reference", sa.String(), nullable=False),
        sa.Column("organisation_id", sa.UUID(), nullable=False),
        sa.Column("service_domain_id", sa.UUID(), nullable=True),
        sa.Column("worker_team", sa.String(), nullable=True),
        sa.Column("subject_initials", sa.String(), nullable=True),
        sa.Column("subject_dob_ciphertext", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["organisation_id"], ["organisation.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["service_domain_id"], ["service_domain.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "case_reference", "organisation_id", "service_domain_id", name="uq_case_record_ref_org_domain"
        ),
    )
    op.create_index("ix_case_record_case_reference", "case_record", ["case_reference"], unique=False)

    op.add_column("transcription", sa.Column("case_id", sa.UUID(), nullable=True))
    op.add_column("transcription", sa.Column("case_reference", sa.String(), nullable=True))
    op.add_column("transcription", sa.Column("worker_team", sa.String(), nullable=True))
    op.add_column("transcription", sa.Column("subject_initials", sa.String(), nullable=True))
    op.add_column("transcription", sa.Column("subject_dob_ciphertext", sa.String(), nullable=True))
    op.create_foreign_key(
        "fk_transcription_case_record",
        "transcription",
        "case_record",
        ["case_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.add_column("minute", sa.Column("case_id", sa.UUID(), nullable=True))
    op.add_column("minute", sa.Column("worker_team", sa.String(), nullable=True))
    op.add_column("minute", sa.Column("subject_initials", sa.String(), nullable=True))
    op.add_column("minute", sa.Column("subject_dob_ciphertext", sa.String(), nullable=True))
    op.create_foreign_key(
        "fk_minute_case_record",
        "minute",
        "case_record",
        ["case_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_minute_case_record", "minute", type_="foreignkey")
    op.drop_column("minute", "subject_dob_ciphertext")
    op.drop_column("minute", "subject_initials")
    op.drop_column("minute", "worker_team")
    op.drop_column("minute", "case_id")

    op.drop_constraint("fk_transcription_case_record", "transcription", type_="foreignkey")
    op.drop_column("transcription", "subject_dob_ciphertext")
    op.drop_column("transcription", "subject_initials")
    op.drop_column("transcription", "worker_team")
    op.drop_column("transcription", "case_reference")
    op.drop_column("transcription", "case_id")

    op.drop_index("ix_case_record_case_reference", table_name="case_record")
    op.drop_table("case_record")
