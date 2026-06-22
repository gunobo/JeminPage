from pydantic import BaseModel

class SkillGroup(BaseModel):
    category: str
    skills: list[str]

class ProfileOut(BaseModel):
    name: str
    tagline: str
    bio: str
    github_url: str
    email: str
    portfolio_url: str
    avatar_url: str
    cv_url: str
    og_image_url: str
    skill_groups: list[SkillGroup]

    model_config = {"from_attributes": True}

class ProfileUpdate(BaseModel):
    name: str = ""
    tagline: str = ""
    bio: str = ""
    github_url: str = ""
    email: str = ""
    portfolio_url: str = ""
    avatar_url: str = ""
    cv_url: str = ""
    og_image_url: str = ""
    skill_groups: list[SkillGroup] = []
