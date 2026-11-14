from datetime import date
from typing import Any
from pydantic import BaseModel, Field, field_validator


class AwardCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    competition: str = Field(min_length=1, max_length=200)
    organizer: str | None = Field(default=None, max_length=200)
    awarded_date: date | None = None
    project_id: int | None = None
    description: str | None = None
    link_url: str | None = Field(default=None, max_length=500)
    sort_order: int | None = None

    @field_validator("organizer", "description", "link_url", mode="before")
    @classmethod
    def blank_to_none(cls, v: Any) -> Any:
        if isinstance(v, str) and not v.strip():
            return None
        return v

    @field_validator("link_url")
    @classmethod
    def http_only(cls, v: str | None) -> str | None:
        # javascript: 같은 스킴이 href로 렌더링되지 않게
        if v and not v.lower().startswith(("http://", "https://")):
            raise ValueError("링크는 http(s):// 로 시작해야 합니다")
        return v


class AwardOut(AwardCreate):
    id: int

    model_config = {"from_attributes": True}
