from pydantic import BaseModel

class OrgOut(BaseModel):
    id: int
    name: str
    role: str
    period: str
    description: str
    logo_url: str
    link_url: str
    order: int

    model_config = {"from_attributes": True}

class OrgCreate(BaseModel):
    name: str
    role: str = ""
    period: str = ""
    description: str = ""
    logo_url: str = ""
    link_url: str = ""
    order: int = 0
