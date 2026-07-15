from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import httpx

from ..database import get_db
from ..auth.utils import require_auth
from .models import VelogPost
from .schemas import VelogPostOut

router = APIRouter(prefix="/velog", tags=["velog"])

VELOG_USERNAME = "startea0716"
VELOG_GQL = "https://v2.velog.io/graphql"

GQL_QUERY = """
query Posts($username: String!, $cursor: ID, $limit: Int) {
  posts(username: $username, cursor: $cursor, limit: $limit) {
    id
    title
    short_description
    thumbnail
    url_slug
    tags
    released_at
  }
}
"""

@router.get("", response_model=list[VelogPostOut])
def list_displayed(db: Session = Depends(get_db)):
    return db.query(VelogPost).filter(VelogPost.is_displayed == True).order_by(VelogPost.released_at.desc()).all()

@router.get("/all", response_model=list[VelogPostOut])
def list_all(db: Session = Depends(get_db), _=Depends(require_auth)):
    return db.query(VelogPost).order_by(VelogPost.released_at.desc()).all()

@router.post("/sync")
async def sync_from_velog(db: Session = Depends(get_db), _=Depends(require_auth)):
    posts = []
    cursor = None

    async with httpx.AsyncClient(timeout=15) as client:
        while True:
            variables = {"username": VELOG_USERNAME, "limit": 20}
            if cursor:
                variables["cursor"] = cursor

            resp = await client.post(VELOG_GQL, json={"query": GQL_QUERY, "variables": variables})
            resp.raise_for_status()
            data = resp.json()

            batch = data.get("data", {}).get("posts", [])
            if not batch:
                break
            posts.extend(batch)
            if len(batch) < 20:
                break
            cursor = batch[-1]["id"]

    new_count = 0
    for p in posts:
        existing = db.query(VelogPost).filter(VelogPost.velog_id == p["id"]).first()
        released = None
        if p.get("released_at"):
            try:
                released = datetime.fromisoformat(p["released_at"].replace("Z", "+00:00"))
            except Exception:
                pass

        if existing:
            existing.title = p["title"]
            existing.short_description = p.get("short_description")
            existing.thumbnail = p.get("thumbnail")
            existing.tags = p.get("tags") or []
            existing.released_at = released
        else:
            db.add(VelogPost(
                velog_id=p["id"],
                title=p["title"],
                slug=p["url_slug"],
                short_description=p.get("short_description"),
                thumbnail=p.get("thumbnail"),
                tags=p.get("tags") or [],
                released_at=released,
                is_displayed=False,
            ))
            new_count += 1

    db.commit()
    return {"synced": len(posts), "new": new_count}

@router.patch("/{post_id}/toggle", response_model=VelogPostOut)
def toggle_display(post_id: int, db: Session = Depends(get_db), _=Depends(require_auth)):
    post = db.get(VelogPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Not found")
    post.is_displayed = not post.is_displayed
    db.commit()
    db.refresh(post)
    return post
