"""이력서용 profile.education

Revision ID: 0003_profile_education
Revises: 0002_case_study_awards
Create Date: 2026-11-14
"""
from alembic import op
import sqlalchemy as sa

revision = "0003_profile_education"
down_revision = "0002_case_study_awards"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("profile", sa.Column("education", sa.JSON, nullable=True))


def downgrade() -> None:
    op.drop_column("profile", "education")
