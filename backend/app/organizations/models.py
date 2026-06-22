from sqlalchemy import Column, Integer, String, Text
from ..database import Base

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    institution = Column(String(200), default="")
    role = Column(String(200), default="")
    period = Column(String(100), default="")
    description = Column(Text, default="")
    logo_url = Column(String(500), default="")
    link_url = Column(String(500), default="")
    order = Column(Integer, default=0)
