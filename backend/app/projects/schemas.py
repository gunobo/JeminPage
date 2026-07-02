from pydantic import BaseModel
from datetime import datetime

class ProjectBase(BaseModel):
    title: str
    description: str
    tech_stack: list[str] = []
    github_url: str | None = None
    demo_url: str | None = None
    thumbnail_url: str | None = None
    is_featured: bool = False
    category: str | None = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(ProjectBase):
    pass

class ProjectOut(ProjectBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}
