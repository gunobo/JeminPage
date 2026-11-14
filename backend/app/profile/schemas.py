from pydantic import BaseModel, Field, field_validator
from typing import Any, Literal, Union

class SkillItem(BaseModel):
    name: str
    desc: str = ""

class SkillGroup(BaseModel):
    category: str
    skills: list[Union[str, SkillItem]]

class YearlyGoal(BaseModel):
    text: str
    done: bool = False
    year: int = 2026

class EducationItem(BaseModel):
    school: str = Field(max_length=200)
    major: str = Field(default="", max_length=200)
    period: str = Field(default="", max_length=100)
    status: str = Field(default="", max_length=50)  # 재학 / 졸업 / 졸업예정 ...


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
    cv_mode: Literal["generated", "upload"] = "generated"
    skill_groups: list[SkillGroup] = []
    yearly_goals: list[YearlyGoal] = []
    marquee_items: list[str] = []
    education: list[EducationItem] = []

    @field_validator("skill_groups", "yearly_goals", "marquee_items", "education", mode="before")
    @classmethod
    def coerce_none_to_list(cls, v: Any) -> Any:
        return v if v is not None else []

    @field_validator("cv_mode", mode="before")
    @classmethod
    def default_cv_mode(cls, v: Any) -> Any:
        return v if v in ("generated", "upload") else "generated"

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
    cv_mode: Literal["generated", "upload"] = "generated"
    skill_groups: list[SkillGroup] = []
    yearly_goals: list[YearlyGoal] = []
    marquee_items: list[str] = []
    education: list[EducationItem] = Field(default=[], max_length=10)
