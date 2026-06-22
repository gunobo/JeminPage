from sqlalchemy import Column, Integer, String, Date
from ..database import Base
from datetime import date


class VisitorDay(Base):
    __tablename__ = "visitor_days"

    id = Column(Integer, primary_key=True)
    day = Column(Date, unique=True, nullable=False, default=date.today)
    count = Column(Integer, default=0)
