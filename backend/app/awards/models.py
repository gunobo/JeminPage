from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey
from ..database import Base


class Award(Base):
    __tablename__ = "awards"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    competition = Column(String(200), nullable=False)
    organizer = Column(String(200), nullable=True)
    awarded_date = Column(Date, nullable=True)
    # 출품작 — 프로젝트가 삭제되면 연결만 끊는다
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    description = Column(Text, nullable=True)
    link_url = Column(String(500), nullable=True)
    sort_order = Column(Integer, nullable=True)
