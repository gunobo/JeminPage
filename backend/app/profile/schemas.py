from pydantic import BaseModel, field_validator
from typing import Any

class SkillGroup(BaseModel):
    category: str
    skills: list[str]

class YearlyGoal(BaseModel):
    text: str
    done: bool = False
    year: int = 2026

class ProfileOut(BaseModel):
    name: str
    tagline: str
    bio: str
    github_url: str
    email: str
    portfolio_url: str
    avatar_url: str
    discord: str
    cv_url: str
    og_image_url: str
    skill_groups: list[SkillGroup] = []
    yearly_goals: list[YearlyGoal] = []
    marquee_items: list[str] = []

    @field_validator("skill_groups", "yearly_goals", "marquee_items", mode="before")
    @classmethod
    def coerce_none_to_list(cls, v: Any) -> Any:
        return v if v is not None else []

    model_config = {"from_attributes": True}

class ProfileUpdate(BaseModel):
    name: str = ""
    tagline: str = ""
    bio: str = ""
    github_url: str = ""
    email: str = ""
    portfolio_url: str = ""
    avatar_url: str = ""
    discord: str = ""
    cv_url: str = ""
    og_image_url: str = ""
    skill_groups: list[SkillGroup] = []
    yearly_goals: list[YearlyGoal] = []
    marquee_items: list[str] = []
