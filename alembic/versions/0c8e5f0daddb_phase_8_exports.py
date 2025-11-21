"""Phase 8 exports & m365 integration columns

Revision ID: 0c8e5f0daddb
Revises: f6c1d2e4ea11
Create Date: 2025-11-21 01:13:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0c8e5f0daddb"
down_revision: Union[str, None] = "f6c1d2e4ea11"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("minute", sa.Column("docx_blob_path", sa.String(), nullable=True))
    op.add_column("minute", sa.Column("pdf_blob_path", sa.String(), nullable=True))
    op.add_column("minute", sa.Column("sharepoint_docx_item_id", sa.String(), nullable=True))
    op.add_column("minute", sa.Column("sharepoint_pdf_item_id", sa.String(), nullable=True))
    op.add_column(
        "minute",
        sa.Column(
            "planner_task_ids",
            sa.dialects.postgresql.JSONB(astext_type=sa.Text()),
            server_default="'[]'::jsonb",
            nullable=False,
        ),
    )
    op.add_column("minute", sa.Column("export_status", sa.String(), nullable=True))
    op.add_column("minute", sa.Column("export_error", sa.Text(), nullable=True))
    op.add_column("minute", sa.Column("last_exported_at", sa.TIMESTAMP(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("minute", "last_exported_at")
    op.drop_column("minute", "export_error")
    op.drop_column("minute", "export_status")
    op.drop_column("minute", "planner_task_ids")
    op.drop_column("minute", "sharepoint_pdf_item_id")
    op.drop_column("minute", "sharepoint_docx_item_id")
    op.drop_column("minute", "pdf_blob_path")
    op.drop_column("minute", "docx_blob_path")
