"""Add minute task table for structured action tracking

Revision ID: 7c9d5e561b3a
Revises: 20a0f2c1d3ab
Create Date: 2025-11-23 02:20:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "7c9d5e561b3a"
down_revision: Union[str, None] = "20a0f2c1d3ab"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "minute_task",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_datetime", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_datetime", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("minute_id", sa.UUID(), nullable=False),
        sa.Column("organisation_id", sa.UUID(), nullable=True),
        sa.Column("service_domain_id", sa.UUID(), nullable=True),
        sa.Column("case_id", sa.UUID(), nullable=True),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("owner", sa.String(), nullable=True),
        sa.Column("owner_role", sa.String(), nullable=True),
        sa.Column("due_date", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="pending"),
        sa.Column("source", sa.String(), nullable=False, server_default="ai_generated"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("planner_task_id", sa.String(), nullable=True),
        sa.Column("last_synced_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["minute_id"], ["minute.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["organisation_id"], ["organisation.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["service_domain_id"], ["service_domain.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["case_id"], ["case_record.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_minute_task_minute_id", "minute_task", ["minute_id"], unique=False)
    op.create_index("ix_minute_task_status", "minute_task", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_minute_task_status", table_name="minute_task")
    op.drop_index("ix_minute_task_minute_id", table_name="minute_task")
    op.drop_table("minute_task")
