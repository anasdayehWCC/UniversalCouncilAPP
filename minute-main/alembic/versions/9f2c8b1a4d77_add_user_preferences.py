"""Add user preferences for appearance settings

Revision ID: 9f2c8b1a4d77
Revises: fe0e69c8d4db
Create Date: 2026-03-28 22:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "9f2c8b1a4d77"
down_revision: str | None = "fe0e69c8d4db"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "user_preference",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_datetime", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_datetime", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("color_mode", sa.String(length=16), server_default=sa.text("'system'"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_user_preference_user_id"),
    )
    op.create_index("ix_user_preference_user_id", "user_preference", ["user_id"], unique=False)
    op.create_index("ix_user_preference_color_mode", "user_preference", ["color_mode"], unique=False)

    op.execute(
        sa.text(
            """
            INSERT INTO user_preference (id, created_datetime, updated_datetime, user_id, color_mode)
            SELECT gen_random_uuid(), now(), now(), id, 'system'
            FROM "user"
            ON CONFLICT (user_id) DO NOTHING
            """
        )
    )


def downgrade() -> None:
    op.drop_index("ix_user_preference_color_mode", table_name="user_preference")
    op.drop_index("ix_user_preference_user_id", table_name="user_preference")
    op.drop_table("user_preference")
