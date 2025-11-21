"""Phase 9 audit trail and retention policy

Revision ID: 1a2b3c4d5e9a
Revises: 0c8e5f0daddb
Create Date: 2025-11-21 01:22:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "1a2b3c4d5e9a"
down_revision: Union[str, None] = "0c8e5f0daddb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "retention_policy",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_datetime", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_datetime", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("organisation_id", sa.UUID(), nullable=True),
        sa.Column("service_domain_id", sa.UUID(), nullable=True),
        sa.Column("audio_retention_days", sa.Integer(), nullable=True),
        sa.Column("transcript_retention_days", sa.Integer(), nullable=True),
        sa.Column("minute_retention_days", sa.Integer(), nullable=True),
        sa.Column("strict_data_retention", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.ForeignKeyConstraint(["organisation_id"], ["organisation.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["service_domain_id"], ["service_domain.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "audit_event",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_datetime", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_datetime", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=True),
        sa.Column("organisation_id", sa.UUID(), nullable=True),
        sa.Column("service_domain_id", sa.UUID(), nullable=True),
        sa.Column("case_id", sa.UUID(), nullable=True),
        sa.Column("resource_type", sa.String(), nullable=False, server_default="unknown"),
        sa.Column("resource_id", sa.UUID(), nullable=True),
        sa.Column("action", sa.String(), nullable=False, server_default=""),
        sa.Column("outcome", sa.String(), nullable=False, server_default="unknown"),
        sa.Column("path", sa.String(), nullable=False, server_default=""),
        sa.Column("ip_address", sa.String(), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["case_id"], ["case_record.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["organisation_id"], ["organisation.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["service_domain_id"], ["service_domain.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_event_created", "audit_event", ["created_datetime"], unique=False)
    op.create_index("ix_retention_policy_domain", "retention_policy", ["service_domain_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_retention_policy_domain", table_name="retention_policy")
    op.drop_index("ix_audit_event_created", table_name="audit_event")
    op.drop_table("audit_event")
    op.drop_table("retention_policy")
