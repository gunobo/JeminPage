from pydantic import BaseModel

class OrgOut(BaseModel):
    id: int
    name: str
    institution: str
    role: str
    period: str
    description: str
    logo_url: str
    link_url: str

    model_config = {"from_attributes": True}

class OrgCreate(BaseModel):
    name: str
    institution: str = ""
    role: str = ""
    period: str = ""
    description: str = ""
    logo_url: str = ""
    link_url: str = ""
