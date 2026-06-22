from pydantic import BaseModel
from datetime import datetime

class BlogPostBase(BaseModel):
    title: str
    slug: str
    content: str
    excerpt: str | None = None
    tags: list[str] = []
    thumbnail_url: str | None = None
    is_published: bool = False

class BlogPostCreate(BlogPostBase):
    pass

class BlogPostUpdate(BlogPostBase):
    pass

class BlogPostOut(BlogPostBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
