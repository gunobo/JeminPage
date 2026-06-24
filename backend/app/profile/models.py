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
    # [{"category": "Backend", "skills": ["Python", "FastAPI"]}]
    skill_groups = Column(JSON, default=list)
    yearly_goals = Column(JSON, default=list)
    marquee_items = Column(JSON, default=list)
