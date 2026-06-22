from sqlalchemy import Column, Integer, String, Date
from ..database import Base

class Certification(Base):
    __tablename__ = "certifications"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    issuer = Column(String(200), default="")
    acquired_date = Column(Date, nullable=True)
    credential_url = Column(String(500), default="")
    order = Column(Integer, default=0)
