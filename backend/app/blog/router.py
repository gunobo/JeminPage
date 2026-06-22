from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth.utils import require_auth
from .models import BlogPost
from .schemas import BlogPostCreate, BlogPostUpdate, BlogPostOut

router = APIRouter(prefix="/blog", tags=["blog"])

@router.get("", response_model=list[BlogPostOut])
def list_posts(db: Session = Depends(get_db)):
    return db.query(BlogPost).filter(BlogPost.is_published == True).order_by(BlogPost.created_at.desc()).all()

@router.get("/all", response_model=list[BlogPostOut])
def list_all_posts(db: Session = Depends(get_db), _=Depends(require_auth)):
    return db.query(BlogPost).order_by(BlogPost.created_at.desc()).all()

@router.get("/{slug}", response_model=BlogPostOut)
def get_post(slug: str, db: Session = Depends(get_db)):
    post = db.query(BlogPost).filter(BlogPost.slug == slug).first()
    if not post or not post.is_published:
        raise HTTPException(status_code=404, detail="Not found")
    return post

@router.post("", response_model=BlogPostOut)
def create_post(data: BlogPostCreate, db: Session = Depends(get_db), _=Depends(require_auth)):
    post = BlogPost(**data.model_dump())
    db.add(post)
    db.commit()
    db.refresh(post)
    return post

@router.put("/{post_id}", response_model=BlogPostOut)
def update_post(post_id: int, data: BlogPostUpdate, db: Session = Depends(get_db), _=Depends(require_auth)):
    post = db.get(BlogPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in data.model_dump().items():
        setattr(post, k, v)
    db.commit()
    db.refresh(post)
    return post

@router.delete("/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db), _=Depends(require_auth)):
    post = db.get(BlogPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(post)
    db.commit()
    return {"ok": True}
