"""F1 케이스 스터디 필드 + F5 awards + profile.cv_mode

Revision ID: 0002_case_study_awards
Revises: 0001_baseline
Create Date: 2026-11-14
"""
from alembic import op
import sqlalchemy as sa

revision = "0002_case_study_awards"
down_revision = "0001_baseline"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # F1 — 모두 NULL 허용이라 기존 행은 그대로
    op.add_column("projects", sa.Column("period", sa.String(100), nullable=True))
    op.add_column("projects", sa.Column("team", sa.String(200), nullable=True))
    op.add_column("projects", sa.Column("role", sa.String(200), nullable=True))
    op.add_column("projects", sa.Column("problem", sa.Text, nullable=True))
    op.add_column("projects", sa.Column("troubleshooting", sa.Text, nullable=True))
    op.add_column("projects", sa.Column("results", sa.JSON, nullable=True))
    op.add_column("projects", sa.Column("sort_order", sa.Integer, nullable=True))

    # F5
    op.create_table(
        "awards",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("competition", sa.String(200), nullable=False),
        sa.Column("organizer", sa.String(200), nullable=True),
        sa.Column("awarded_date", sa.Date, nullable=True),
        sa.Column("project_id", sa.Integer, sa.ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("link_url", sa.String(500), nullable=True),
        sa.Column("sort_order", sa.Integer, nullable=True),
    )

    # F3 — CV 선택 옵션. 이미 CV를 올려 둔 경우 기존 동작(업로드 CV)을 유지
    op.add_column("profile", sa.Column("cv_mode", sa.String(20), nullable=True, server_default="generated"))
    op.execute("UPDATE profile SET cv_mode = 'upload' WHERE cv_url IS NOT NULL AND cv_url <> ''")


def downgrade() -> None:
    op.drop_column("profile", "cv_mode")
    op.drop_table("awards")
    for c in ["sort_order", "results", "troubleshooting", "problem", "role", "team", "period"]:
        op.drop_column("projects", c)
