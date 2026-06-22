from pydantic import BaseModel
from datetime import date
from typing import Optional

class CertOut(BaseModel):
    id: int
    name: str
    issuer: str
    acquired_date: Optional[date]
    credential_url: str
    order: int

    model_config = {"from_attributes": True}

class CertCreate(BaseModel):
    name: str
    issuer: str = ""
    acquired_date: Optional[date] = None
    credential_url: str = ""
    order: int = 0
