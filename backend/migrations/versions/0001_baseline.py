"""baseline — create_all() 시절의 스키마 그대로

이미 운영 중인 DB는 이 리비전으로 stamp만 하고(app/migrate.py가 자동 처리),
새 DB에서는 이 리비전이 테이블을 만든다.

Revision ID: 0001_baseline
Revises:
Create Date: 2026-11-14
"""
from alembic import op
import sqlalchemy as sa

revision = "0001_baseline"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "projects",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("tech_stack", sa.JSON),
        sa.Column("github_url", sa.String(500)),
        sa.Column("demo_url", sa.String(500)),
        sa.Column("thumbnail_url", sa.String(500)),
        sa.Column("is_featured", sa.Boolean),
        sa.Column("category", sa.String(100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "contact_messages",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("email", sa.String(200), nullable=False),
        sa.Column("message", sa.Text, nullable=False),
        sa.Column("is_read", sa.Boolean),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "profile",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(100)),
        sa.Column("tagline", sa.String(200)),
        sa.Column("bio", sa.Text),
        sa.Column("github_url", sa.String(500)),
        sa.Column("email", sa.String(200)),
        sa.Column("portfolio_url", sa.String(500)),
        sa.Column("avatar_url", sa.String(500)),
        sa.Column("discord", sa.String(200)),
        sa.Column("cv_url", sa.String(500)),
        sa.Column("og_image_url", sa.String(500)),
        sa.Column("skill_groups", sa.JSON),
        sa.Column("yearly_goals", sa.JSON),
        sa.Column("marquee_items", sa.JSON),
    )
    op.create_table(
        "blog_posts",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("slug", sa.String(300), unique=True, nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("excerpt", sa.Text),
        sa.Column("tags", sa.JSON),
        sa.Column("thumbnail_url", sa.String(500)),
        sa.Column("is_published", sa.Boolean),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "visitor_days",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("day", sa.Date, unique=True, nullable=False),
        sa.Column("count", sa.Integer),
    )
    op.create_table(
        "organizations",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("institution", sa.String(200)),
        sa.Column("role", sa.String(200)),
        sa.Column("period", sa.String(100)),
        sa.Column("description", sa.Text),
        sa.Column("logo_url", sa.String(500)),
        sa.Column("link_url", sa.String(500)),
    )
    op.create_table(
        "certifications",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("issuer", sa.String(200)),
        sa.Column("acquired_date", sa.Date, nullable=True),
        sa.Column("credential_url", sa.String(500)),
        sa.Column("order", sa.Integer),
    )
    op.create_table(
        "velog_posts",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("velog_id", sa.String(100), unique=True, nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("slug", sa.String(500), nullable=False),
        sa.Column("short_description", sa.Text),
        sa.Column("thumbnail", sa.String(500)),
        sa.Column("tags", sa.JSON),
        sa.Column("released_at", sa.DateTime(timezone=True)),
        sa.Column("series_name", sa.String(200), nullable=True),
        sa.Column("series_slug", sa.String(200), nullable=True),
        sa.Column("is_displayed", sa.Boolean),
        sa.Column("synced_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    for t in ["velog_posts", "certifications", "organizations", "visitor_days", "blog_posts", "profile", "contact_messages", "projects"]:
        op.drop_table(t)
