"""add_rbac_tables

Revision ID: a1b2c3d4e5f6
Revises: fe0e69c8d4db
Create Date: 2025-11-20 18:50:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '9d080ca9fe6c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create Organisation table
    op.create_table('organisation',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('created_datetime', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_datetime', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_organisation_name'), 'organisation', ['name'], unique=False)

    # Create ServiceDomain table
    op.create_table('service_domain',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('created_datetime', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_datetime', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('organisation_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['organisation_id'], ['organisation.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_service_domain_name'), 'service_domain', ['name'], unique=False)

    # Create Role table
    op.create_table('role',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('created_datetime', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_datetime', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_role_name'), 'role', ['name'], unique=True)

    # Create UserOrgRole table
    op.create_table('user_org_role',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('created_datetime', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_datetime', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('organisation_id', sa.UUID(), nullable=False),
        sa.Column('service_domain_id', sa.UUID(), nullable=True),
        sa.Column('role_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['organisation_id'], ['organisation.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['role_id'], ['role.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['service_domain_id'], ['service_domain.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Add columns to existing tables
    # Minute
    op.add_column('minute', sa.Column('organisation_id', sa.UUID(), nullable=True))
    op.add_column('minute', sa.Column('service_domain_id', sa.UUID(), nullable=True))
    op.add_column('minute', sa.Column('case_reference', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.create_index(op.f('ix_minute_case_reference'), 'minute', ['case_reference'], unique=False)
    op.create_foreign_key(None, 'minute', 'organisation', ['organisation_id'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'minute', 'service_domain', ['service_domain_id'], ['id'], ondelete='SET NULL')

    # Transcription
    op.add_column('transcription', sa.Column('organisation_id', sa.UUID(), nullable=True))
    op.add_column('transcription', sa.Column('service_domain_id', sa.UUID(), nullable=True))
    op.create_foreign_key(None, 'transcription', 'organisation', ['organisation_id'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'transcription', 'service_domain', ['service_domain_id'], ['id'], ondelete='SET NULL')

    # Recording
    op.add_column('recording', sa.Column('organisation_id', sa.UUID(), nullable=True))
    op.add_column('recording', sa.Column('service_domain_id', sa.UUID(), nullable=True))
    op.create_foreign_key(None, 'recording', 'organisation', ['organisation_id'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'recording', 'service_domain', ['service_domain_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    # Remove columns from existing tables
    op.drop_constraint(None, 'recording', type_='foreignkey')
    op.drop_constraint(None, 'recording', type_='foreignkey')
    op.drop_column('recording', 'service_domain_id')
    op.drop_column('recording', 'organisation_id')

    op.drop_constraint(None, 'transcription', type_='foreignkey')
    op.drop_constraint(None, 'transcription', type_='foreignkey')
    op.drop_column('transcription', 'service_domain_id')
    op.drop_column('transcription', 'organisation_id')

    op.drop_constraint(None, 'minute', type_='foreignkey')
    op.drop_constraint(None, 'minute', type_='foreignkey')
    op.drop_index(op.f('ix_minute_case_reference'), table_name='minute')
    op.drop_column('minute', 'case_reference')
    op.drop_column('minute', 'service_domain_id')
    op.drop_column('minute', 'organisation_id')

    # Drop new tables
    op.drop_table('user_org_role')
    op.drop_index(op.f('ix_role_name'), table_name='role')
    op.drop_table('role')
    op.drop_index(op.f('ix_service_domain_name'), table_name='service_domain')
    op.drop_table('service_domain')
    op.drop_index(op.f('ix_organisation_name'), table_name='organisation')
    op.drop_table('organisation')
