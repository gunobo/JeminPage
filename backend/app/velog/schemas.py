from pydantic import BaseModel
from datetime import datetime

class VelogPostOut(BaseModel):
    id: int
    velog_id: str
    title: str
    slug: str
    short_description: str | None = None
    thumbnail: str | None = None
    tags: list[str] = []
    released_at: datetime | None = None
    is_displayed: bool

    model_config = {"from_attributes": True}
