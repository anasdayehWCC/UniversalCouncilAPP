"""Add created_by foreign key to minute

Revision ID: c2f7890abc12
Revises: a1b2c3d4e5f6
Create Date: 2025-11-20 20:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c2f7890abc12"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("minute", sa.Column("created_by_user_id", sa.UUID(), nullable=True))
    op.create_foreign_key(
        "fk_minute_created_by_user",
        "minute",
        "user",
        ["created_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )

    # Backfill using existing transcription ownership
    op.execute(
        """
        UPDATE minute m
        SET created_by_user_id = t.user_id
        FROM transcription t
        WHERE m.transcription_id = t.id AND m.created_by_user_id IS NULL;
        """
    )


def downgrade() -> None:
    op.drop_constraint("fk_minute_created_by_user", "minute", type_="foreignkey")
    op.drop_column("minute", "created_by_user_id")
