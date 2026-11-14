from sqlalchemy import Column, Integer, String, Text, JSON
from ..database import Base

class Profile(Base):
    __tablename__ = "profile"

    id = Column(Integer, primary_key=True, default=1)
    name = Column(String(100), default="")
    tagline = Column(String(200), default="")
    bio = Column(Text, default="")
    github_url = Column(String(500), default="")
    email = Column(String(200), default="")
    portfolio_url = Column(String(500), default="")
    avatar_url = Column(String(500), default="")
    discord = Column(String(200), default="")
    cv_url = Column(String(500), default="")
    og_image_url = Column(String(500), default="")
    # "generated" = 자동 생성 PDF, "upload" = 직접 올린 cv_url
    cv_mode = Column(String(20), default="generated", nullable=True)
    # 이력서용 학력 [{"school": "부산소프트웨어마이스터고", "major": "소프트웨어개발과", "period": "2025.03 ~", "status": "재학"}]
    education = Column(JSON, default=list, nullable=True)
    # [{"category": "Backend", "skills": ["Python", "FastAPI"]}]
    skill_groups = Column(JSON, default=list)
    yearly_goals = Column(JSON, default=list)
    marquee_items = Column(JSON, default=list)
