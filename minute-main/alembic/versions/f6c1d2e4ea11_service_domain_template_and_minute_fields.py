"""Add service_domain_template and minute context fields

Revision ID: f6c1d2e4ea11
Revises: e5f1a0c5a9ab
Create Date: 2025-11-21 00:28:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f6c1d2e4ea11"
down_revision: Union[str, None] = "e5f1a0c5a9ab"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "service_domain_template",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_datetime", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_datetime", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("service_domain_id", sa.UUID(), nullable=False),
        sa.Column("template_name", sa.String(), nullable=False),
        sa.Column("enabled", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.ForeignKeyConstraint(["service_domain_id"], ["service_domain.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_service_domain_template_service_domain_id",
        "service_domain_template",
        ["service_domain_id"],
        unique=False,
    )
    op.create_index(
        "ix_service_domain_template_template_name",
        "service_domain_template",
        ["template_name"],
        unique=False,
    )

    op.add_column("minute", sa.Column("visit_type", sa.String(), nullable=True))
    op.add_column("minute", sa.Column("intended_outcomes", sa.String(), nullable=True))
    op.add_column("minute", sa.Column("risk_flags", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("minute", "risk_flags")
    op.drop_column("minute", "intended_outcomes")
    op.drop_column("minute", "visit_type")
    op.drop_index("ix_service_domain_template_template_name", table_name="service_domain_template")
    op.drop_index("ix_service_domain_template_service_domain_id", table_name="service_domain_template")
    op.drop_table("service_domain_template")
