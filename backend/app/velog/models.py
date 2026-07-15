from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from ..database import Base

class VelogPost(Base):
    __tablename__ = "velog_posts"

    id = Column(Integer, primary_key=True, index=True)
    velog_id = Column(String(100), unique=True, nullable=False)
    title = Column(String(500), nullable=False)
    slug = Column(String(500), nullable=False)
    short_description = Column(Text)
    thumbnail = Column(String(500))
    tags = Column(JSON, default=list)
    released_at = Column(DateTime(timezone=True))
    series_name = Column(String(200), nullable=True)
    series_slug = Column(String(200), nullable=True)
    is_displayed = Column(Boolean, default=False)
    synced_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
