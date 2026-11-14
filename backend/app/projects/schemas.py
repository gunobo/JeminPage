from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Any


class ProjectBase(BaseModel):
    title: str = Field(max_length=200)
    description: str
    tech_stack: list[str] = []
    github_url: str | None = Field(default=None, max_length=500)
    demo_url: str | None = Field(default=None, max_length=500)
    thumbnail_url: str | None = Field(default=None, max_length=500)
    is_featured: bool = False
    category: str | None = Field(default=None, max_length=100)

    # 케이스 스터디 (모두 optional)
    period: str | None = Field(default=None, max_length=100)
    team: str | None = Field(default=None, max_length=200)
    role: str | None = Field(default=None, max_length=200)
    problem: str | None = None
    troubleshooting: str | None = None
    results: list[str] | None = None
    sort_order: int | None = None

    @field_validator("results", mode="before")
    @classmethod
    def clean_results(cls, v: Any) -> Any:
        # 빈 줄 제거 — 프론트에서도 지우지만 API 직접 호출에도 대비
        if isinstance(v, list):
            v = [s.strip() for s in v if isinstance(s, str) and s.strip()]
            return v or None
        return v

    @field_validator("period", "team", "role", "problem", "troubleshooting", "category", mode="before")
    @classmethod
    def blank_to_none(cls, v: Any) -> Any:
        if isinstance(v, str) and not v.strip():
            return None
        return v


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(ProjectBase):
    pass


class ProjectOrder(BaseModel):
    ids: list[int] = Field(max_length=1000)


class ProjectOut(ProjectBase):
    id: int
    created_at: datetime

    @field_validator("tech_stack", mode="before")
    @classmethod
    def none_to_list(cls, v: Any) -> Any:
        return v if v is not None else []

    model_config = {"from_attributes": True}
