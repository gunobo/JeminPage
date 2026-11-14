from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from ..database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    tech_stack = Column(JSON, default=list)
    github_url = Column(String(500))
    demo_url = Column(String(500))
    thumbnail_url = Column(String(500))
    is_featured = Column(Boolean, default=False)
    category = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # ── 케이스 스터디 (F1) ──
    period = Column(String(100), nullable=True)
    team = Column(String(200), nullable=True)
    role = Column(String(200), nullable=True)
    problem = Column(Text, nullable=True)
    troubleshooting = Column(Text, nullable=True)  # "## 제목" 으로 항목 구분
    results = Column(JSON, nullable=True)  # ["성과 1", "성과 2"]
    sort_order = Column(Integer, nullable=True)
