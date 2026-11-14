"""F4 — 페이지별 메타 태그, sitemap.xml.

nginx SSI가 index.html의 `<!--# include virtual="/__meta" -->` 를 이 라우터의 /meta/ssi 결과로 채운다.
모든 값은 관리자 입력이므로 HTML 속성/텍스트 이스케이프를 반드시 거친다.
"""
import json
import re
from html import escape
from urllib.parse import urlsplit
from xml.sax.saxutils import escape as xml_escape

from fastapi import APIRouter, Depends, Header, Query, Response
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from ..blog.models import BlogPost
from ..config import settings
from ..database import get_db
from ..profile.models import Profile
from ..projects.models import Project

router = APIRouter(tags=["seo"])

DEFAULT_IMAGE = "/og-image.png"


def _abs(url: str | None) -> str:
    base = settings.SITE_URL.rstrip("/")
    if not url:
        return base + DEFAULT_IMAGE
    if url.startswith(("http://", "https://")):
        return url
    if url.startswith("/"):
        return base + url
    return base + DEFAULT_IMAGE


def _clip(text: str | None, n: int) -> str:
    t = re.sub(r"\s+", " ", (text or "")).strip()
    return t if len(t) <= n else t[: n - 1].rstrip() + "…"


def _normalize_path(raw: str | None) -> str:
    path = urlsplit(raw or "/").path or "/"
    if not path.startswith("/"):
        path = "/" + path
    return path.rstrip("/") or "/"


def build_meta(db: Session, raw_path: str | None) -> dict:
    path = _normalize_path(raw_path)
    p = db.get(Profile, 1)
    name = (p.name if p else "") or "imjemin"
    default_title = f"{name} — {p.tagline}" if p and p.tagline else name
    default_desc = _clip(p.bio if p else "", 160)
    default_image = _abs(p.og_image_url if p else None)
    base = settings.SITE_URL.rstrip("/")

    meta = {"title": default_title, "description": default_desc, "image": default_image,
            "url": base + "/", "type": "website", "path": path}

    if m := re.fullmatch(r"/projects/(\d{1,9})", path):
        proj = db.get(Project, int(m.group(1)))
        if proj:
            meta.update(title=f"{proj.title} — {name}", description=_clip(proj.description, 120),
                        image=_abs(proj.thumbnail_url) if proj.thumbnail_url else default_image,
                        url=f"{base}{path}", type="article")
    elif m := re.fullmatch(r"/blog/([^/]{1,300})", path):
        from urllib.parse import unquote
        post = db.query(BlogPost).filter(BlogPost.slug == unquote(m.group(1)), BlogPost.is_published.is_(True)).first()
        if post:
            meta.update(title=f"{post.title} — {name}", description=_clip(post.excerpt or post.content, 120),
                        image=_abs(post.thumbnail_url) if post.thumbnail_url else default_image,
                        url=f"{base}{path}", type="article")
    elif path in ("/projects", "/blog", "/contact", "/privacy"):
        label = {"/projects": "Projects", "/blog": "Blog", "/contact": "Contact", "/privacy": "개인정보처리방침"}[path]
        meta.update(title=f"{label} — {name}", url=f"{base}{path}")

    return meta


def _person_jsonld(db: Session) -> str:
    p = db.get(Profile, 1)
    same_as = [u for u in [p.github_url if p else "", "https://velog.io/@startea0716"] if u]
    data = {"@context": "https://schema.org", "@type": "Person", "name": (p.name if p else "") or "임제민",
            "url": settings.SITE_URL.rstrip("/") + "/", "sameAs": same_as}
    if p and p.tagline:
        data["jobTitle"] = p.tagline
    # </script> 탈출 방지
    return json.dumps(data, ensure_ascii=False).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")


def render_head(db: Session, raw_path: str | None) -> str:
    m = build_meta(db, raw_path)
    a = lambda v: escape(str(v), quote=True)  # noqa: E731
    tags = [
        f"<title>{a(m['title'])}</title>",
        f'<meta name="description" content="{a(m["description"])}" />',
        f'<link rel="canonical" href="{a(m["url"])}" />',
        f'<meta property="og:type" content="{a(m["type"])}" />',
        f'<meta property="og:url" content="{a(m["url"])}" />',
        f'<meta property="og:title" content="{a(m["title"])}" />',
        f'<meta property="og:description" content="{a(m["description"])}" />',
        f'<meta property="og:image" content="{a(m["image"])}" />',
        f'<meta name="twitter:title" content="{a(m["title"])}" />',
        f'<meta name="twitter:description" content="{a(m["description"])}" />',
        f'<meta name="twitter:image" content="{a(m["image"])}" />',
    ]
    if m["path"] == "/":
        tags.append(f'<script type="application/ld+json">{_person_jsonld(db)}</script>')
    return "\n".join(tags)


@router.get("/meta")
def meta(path: str = Query("/", max_length=1000), db: Session = Depends(get_db)):
    m = build_meta(db, path)
    return {k: m[k] for k in ("title", "description", "image", "url")}


@router.get("/meta/ssi", response_class=HTMLResponse, include_in_schema=False)
def meta_ssi(x_original_uri: str | None = Header(None), db: Session = Depends(get_db)):
    return render_head(db, (x_original_uri or "/")[:1000])


@router.get("/seo/sitemap.xml", include_in_schema=False)
def sitemap(db: Session = Depends(get_db)):
    base = settings.SITE_URL.rstrip("/")
    urls: list[tuple[str, str | None]] = [(f"{base}/", None), (f"{base}/projects", None), (f"{base}/blog", None)]
    for p in db.query(Project.id, Project.created_at).order_by(Project.id).all():
        urls.append((f"{base}/projects/{p.id}", p.created_at.date().isoformat() if p.created_at else None))
    from urllib.parse import quote
    for post in db.query(BlogPost.slug, BlogPost.updated_at).filter(BlogPost.is_published.is_(True)).all():
        urls.append((f"{base}/blog/{quote(post.slug)}", post.updated_at.date().isoformat() if post.updated_at else None))

    body = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc, lastmod in urls:
        body.append(f"  <url><loc>{xml_escape(loc)}</loc>" + (f"<lastmod>{lastmod}</lastmod>" if lastmod else "") + "</url>")
    body.append("</urlset>")
    return Response("\n".join(body), media_type="application/xml")
