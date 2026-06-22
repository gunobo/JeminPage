from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth.utils import require_auth
from .models import Profile
from .schemas import ProfileOut, ProfileUpdate

router = APIRouter(prefix="/profile", tags=["profile"])

def _get_or_create(db: Session) -> Profile:
    profile = db.get(Profile, 1)
    if not profile:
        profile = Profile(id=1)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.get("/og-meta", response_class=HTMLResponse, include_in_schema=False)
def og_meta(db: Session = Depends(get_db)):
    p = _get_or_create(db)
    title = f"{p.name} — {p.tagline}" if p.name and p.tagline else (p.name or "imjemin")
    desc = p.bio[:160] if p.bio else ""
    image = p.og_image_url or "https://imjemin.co.kr/og-image.png"
    return f"""<meta name="description" content="{desc}" />
<meta property="og:title" content="{title}" />
<meta property="og:description" content="{desc}" />
<meta property="og:image" content="{image}" />
<meta name="twitter:title" content="{title}" />
<meta name="twitter:description" content="{desc}" />
<meta name="twitter:image" content="{image}" />"""

@router.get("", response_model=ProfileOut)
def get_profile(db: Session = Depends(get_db)):
    return _get_or_create(db)

@router.put("", response_model=ProfileOut)
def update_profile(data: ProfileUpdate, db: Session = Depends(get_db), _=Depends(require_auth)):
    profile = _get_or_create(db)
    for k, v in data.model_dump().items():
        setattr(profile, k, v)
    db.commit()
    db.refresh(profile)
    return profile
