"""포트폴리오 문서 데이터 수집 + 포맷별 렌더링."""
from __future__ import annotations

import io
import os
import re
from dataclasses import dataclass, field
from datetime import date
from typing import Any

from sqlalchemy.orm import Session

from ..awards.models import Award
from ..awards.router import ordered as ordered_awards
from ..certifications.models import Certification
from ..config import settings
from ..organizations.models import Organization
from ..profile.models import Profile
from ..projects.models import Project
from ..projects.router import ordered as ordered_projects

TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "templates")
FONT_DIR = os.environ.get("EXPORT_FONT_DIR", "/app/fonts")


# ─── 데이터 ────────────────────────────────────────────────────────────────────

def split_troubleshooting(text: str | None) -> list[dict[str, str]]:
    """'## 제목' 단위로 나눈 트러블슈팅 항목. 제목 없이 시작하는 글은 '트러블슈팅' 제목으로."""
    if not text or not text.strip():
        return []
    items: list[dict[str, str]] = []
    title, body = None, []
    for line in text.splitlines():
        m = re.match(r"^##\s+(.+)$", line)
        if m:
            if title is not None or any(b.strip() for b in body):
                items.append({"title": title or "트러블슈팅", "body": "\n".join(body).strip()})
            title, body = m.group(1).strip(), []
        else:
            body.append(line)
    if title is not None or any(b.strip() for b in body):
        items.append({"title": title or "트러블슈팅", "body": "\n".join(body).strip()})
    return items


def skill_names(skills: list[Any]) -> list[str]:
    out = []
    for s in skills or []:
        if isinstance(s, str):
            out.append(s)
        elif isinstance(s, dict) and s.get("name"):
            out.append(str(s["name"]))
    return out


def fmt_date(d: date | None, with_day: bool = False) -> str:
    if not d:
        return ""
    return d.strftime("%Y.%m.%d" if with_day else "%Y.%m")


@dataclass
class PortfolioData:
    profile: Profile
    projects: list[dict[str, Any]]
    awards: list[dict[str, Any]]
    orgs: list[Organization]
    certs: list[Certification]
    skill_groups: list[dict[str, Any]] = field(default_factory=list)
    generated: date = field(default_factory=date.today)

    @property
    def site_host(self) -> str:
        return re.sub(r"^https?://", "", settings.SITE_URL).rstrip("/")


def collect(db: Session, scope: str) -> PortfolioData:
    profile = db.get(Profile, 1) or Profile(id=1, name="", tagline="", bio="", email="", github_url="")

    q = ordered_projects(db.query(Project))
    if scope == "featured":
        q = q.filter(Project.is_featured.is_(True))
    project_rows = q.all()

    award_rows = ordered_awards(db.query(Award)).all()
    project_titles = {p.id: p.title for p in db.query(Project.id, Project.title).all()}

    projects = []
    for p in project_rows:
        ts = split_troubleshooting(p.troubleshooting)
        projects.append({
            "id": p.id,
            "title": p.title,
            "meta": [v for v in (p.period, p.team, p.role) if v],
            "description": (p.description or "").strip(),
            "problem": (p.problem or "").strip(),
            "troubleshooting": ts[0] if ts else None,  # 대표 1개
            "results": [r for r in (p.results or []) if isinstance(r, str) and r.strip()],
            "tech_stack": p.tech_stack or [],
            "links": [(label, url) for label, url in (("GitHub", p.github_url), ("Demo", p.demo_url)) if url],
            "awards": [a.title for a in award_rows if a.project_id == p.id],
        })

    awards = [{
        "date": fmt_date(a.awarded_date),
        "title": a.title,
        "competition": a.competition,
        "organizer": a.organizer or "",
        "project": project_titles.get(a.project_id, "") if a.project_id else "",
    } for a in award_rows]

    orgs = db.query(Organization).order_by(Organization.id).all()
    certs = db.query(Certification).order_by(Certification.acquired_date.desc(), Certification.order, Certification.id).all()

    groups = [{"category": g.get("category", ""), "skills": skill_names(g.get("skills", []))}
              for g in (profile.skill_groups or []) if isinstance(g, dict)]
    groups = [g for g in groups if g["skills"]]

    return PortfolioData(profile=profile, projects=projects, awards=awards, orgs=orgs, certs=certs, skill_groups=groups)


def contacts(d: PortfolioData) -> list[tuple[str, str]]:
    p = d.profile
    items = []
    if p.email:
        items.append(("Email", p.email))
    if p.github_url:
        items.append(("GitHub", p.github_url))
    items.append(("Web", settings.SITE_URL))
    return items


# ─── Markdown ─────────────────────────────────────────────────────────────────

def _md_escape_line(s: str) -> str:
    # 줄 맨 앞의 '#', '-', '>' 같은 블록 문법이 의도치 않게 해석되지 않도록
    return re.sub(r"^([#>\-+*]|\d+\.)", r"\\\1", s)


def render_md(d: PortfolioData) -> bytes:
    p = d.profile
    L: list[str] = [f"# {p.name or '포트폴리오'}"]
    if p.tagline:
        L.append(f"**{p.tagline}**")
    L.append("")
    L.append(" · ".join(f"{k}: {v}" for k, v in contacts(d)))
    L.append("")

    if p.bio:
        L += ["## 소개", "", *(_md_escape_line(x) for x in p.bio.strip().splitlines()), ""]

    if d.skill_groups:
        L += ["## 기술 스택", ""]
        L += [f"- **{g['category']}**: {', '.join(g['skills'])}" for g in d.skill_groups]
        L.append("")

    if d.projects:
        L += ["## 프로젝트", ""]
        for pr in d.projects:
            title = pr["title"] + (f" 🏆 {', '.join(pr['awards'])}" if pr["awards"] else "")
            L += [f"### {title}", ""]
            if pr["meta"]:
                L += [" · ".join(pr["meta"]), ""]
            if pr["tech_stack"]:
                L += [f"`{'` `'.join(pr['tech_stack'])}`", ""]
            if pr["description"]:
                L += [*(_md_escape_line(x) for x in pr["description"].splitlines()), ""]
            if pr["problem"]:
                L += ["**문제**", "", *(_md_escape_line(x) for x in pr["problem"].splitlines()), ""]
            if pr["troubleshooting"]:
                ts = pr["troubleshooting"]
                L += [f"**트러블슈팅 — {ts['title']}**", "", *(_md_escape_line(x) for x in ts["body"].splitlines()), ""]
            if pr["results"]:
                L += ["**성과**", "", *(f"- {r}" for r in pr["results"]), ""]
            if pr["links"]:
                L += [" · ".join(f"[{k}]({v})" for k, v in pr["links"]), ""]

    if d.awards:
        L += ["## 수상", ""]
        for a in d.awards:
            parts = [x for x in (a["date"], a["competition"], a["title"]) if x]
            extra = f" ({a['organizer']})" if a["organizer"] else ""
            L.append(f"- {' · '.join(parts)}{extra}")
        L.append("")

    if d.orgs:
        L += ["## 활동", ""]
        for o in d.orgs:
            parts = [x for x in (o.period, o.name, o.role) if x]
            L.append(f"- {' · '.join(parts)}" + (f" — {o.institution}" if o.institution else ""))
        L.append("")

    if d.certs:
        L += ["## 자격증", ""]
        for c in d.certs:
            parts = [x for x in (fmt_date(c.acquired_date), c.name, c.issuer) if x]
            L.append(f"- {' · '.join(parts)}")
        L.append("")

    L += ["---", f"{d.generated.isoformat()} · {d.site_host}", ""]
    return "\n".join(L).encode("utf-8")


# ─── DOCX ─────────────────────────────────────────────────────────────────────

def render_docx(d: PortfolioData) -> bytes:
    from docx import Document
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.oxml.ns import qn
    from docx.shared import Mm, Pt, RGBColor

    FONT = "맑은 고딕"  # Word/한글/Google Docs 모두 대체 폰트로 정상 표시
    GRAY = RGBColor(0x66, 0x66, 0x66)

    doc = Document()
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Mm(210), Mm(297)
    for side in ("left_margin", "right_margin", "top_margin", "bottom_margin"):
        setattr(sec, side, Mm(18))

    def set_font(style_or_run, size=None, bold=None, color=None):
        f = style_or_run.font
        f.name = FONT
        if size:
            f.size = Pt(size)
        if bold is not None:
            f.bold = bold
        if color is not None:
            f.color.rgb = color
        rpr = style_or_run.element.get_or_add_rPr()
        rfonts = rpr.find(qn("w:rFonts"))
        if rfonts is None:
            rfonts = rpr.makeelement(qn("w:rFonts"), {})
            rpr.append(rfonts)
        for attr in ("w:ascii", "w:hAnsi", "w:eastAsia", "w:cs"):
            rfonts.set(qn(attr), FONT)

    set_font(doc.styles["Normal"], 10)
    for name, size in (("Title", 22), ("Heading 1", 13), ("Heading 2", 11.5)):
        set_font(doc.styles[name], size, bold=True, color=RGBColor(0x11, 0x11, 0x11))

    def para(text="", size=None, bold=False, color=None, space_after=2):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(space_after)
        if text:
            set_font(p.add_run(text), size, bold, color)
        return p

    def labeled(label, text):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(3)
        set_font(p.add_run(f"{label}  "), 9.5, True)
        set_font(p.add_run(text), 9.5)

    p = d.profile
    doc.add_paragraph(p.name or "포트폴리오", style="Title")
    if p.tagline:
        para(p.tagline, 11, color=GRAY)
    para(" · ".join(f"{k}: {v}" for k, v in contacts(d)), 9, color=GRAY, space_after=8)

    if p.bio:
        doc.add_heading("소개", level=1)
        for line in p.bio.strip().splitlines():
            para(line)

    if d.skill_groups:
        doc.add_heading("기술 스택", level=1)
        for g in d.skill_groups:
            labeled(g["category"], ", ".join(g["skills"]))

    if d.projects:
        doc.add_heading("프로젝트", level=1)
        for pr in d.projects:
            h = doc.add_heading(pr["title"], level=2)
            if pr["awards"]:
                set_font(h.add_run(f"  수상: {', '.join(pr['awards'])}"), 9, False, GRAY)
            if pr["meta"]:
                para(" · ".join(pr["meta"]), 9, color=GRAY)
            if pr["tech_stack"]:
                para(", ".join(pr["tech_stack"]), 9, color=GRAY)
            if pr["description"]:
                for line in pr["description"].splitlines():
                    para(line)
            if pr["problem"]:
                labeled("문제", pr["problem"])
            if pr["troubleshooting"]:
                ts = pr["troubleshooting"]
                labeled("트러블슈팅", ts["title"])
                for line in ts["body"].splitlines():
                    if line.strip():
                        para(line, 9.5)
            if pr["results"]:
                labeled("성과", "")
                for r in pr["results"]:
                    set_font(doc.add_paragraph(style="List Bullet").add_run(r), 9.5)
            if pr["links"]:
                para(" · ".join(f"{k}: {v}" for k, v in pr["links"]), 9, color=GRAY, space_after=8)

    def bullets(title, rows):
        if not rows:
            return
        doc.add_heading(title, level=1)
        for r in rows:
            set_font(doc.add_paragraph(style="List Bullet").add_run(r), 10)

    bullets("수상", [" · ".join(x for x in (a["date"], a["competition"], a["title"]) if x)
                   + (f" ({a['organizer']})" if a["organizer"] else "") for a in d.awards])
    bullets("활동", [" · ".join(x for x in (o.period, o.name, o.role) if x)
                   + (f" — {o.institution}" if o.institution else "") for o in d.orgs])
    bullets("자격증", [" · ".join(x for x in (fmt_date(c.acquired_date), c.name, c.issuer) if x) for c in d.certs])

    foot = sec.footer.paragraphs[0]
    foot.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_font(foot.add_run(f"{d.generated.isoformat()} · {d.site_host}"), 8, color=GRAY)

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


# ─── PDF ──────────────────────────────────────────────────────────────────────

def _local_static_path(url: str | None) -> str | None:
    """/static/uploads/x.png → 컨테이너 파일 경로. 외부 URL·경로 탈출은 None."""
    if not url or not url.startswith("/static/"):
        return None
    root = os.path.realpath(settings.STATIC_DIR)
    path = os.path.realpath(os.path.join(root, url[len("/static/"):]))
    if not path.startswith(root + os.sep) or not os.path.isfile(path):
        return None
    return path


def _safe_url_fetcher(url: str, *args, **kwargs):
    """WeasyPrint가 여는 URL을 로컬 폰트·업로드 파일로만 제한 (SSRF 방지)."""
    from weasyprint.urls import default_url_fetcher

    if url.startswith("file://"):
        from urllib.parse import urlsplit
        from urllib.request import url2pathname
        import unicodedata

        def norm(p: str) -> str:
            # 퍼센트 인코딩·../·심볼릭 링크·유니코드 정규화(NFC/NFD) 차이를 모두 풀고 비교
            return unicodedata.normalize("NFC", os.path.realpath(p))

        path = norm(url2pathname(urlsplit(url).path))
        allowed = [norm(FONT_DIR), norm(TEMPLATE_DIR), norm(settings.STATIC_DIR)]
        if any(path == a or path.startswith(a + os.sep) for a in allowed):
            return default_url_fetcher(url, *args, **kwargs)
    raise ValueError(f"blocked url: {url[:80]}")


def render_pdf(d: PortfolioData) -> bytes:
    from jinja2 import Environment, FileSystemLoader, select_autoescape
    from weasyprint import HTML

    env = Environment(loader=FileSystemLoader(TEMPLATE_DIR), autoescape=select_autoescape(["html"]))
    avatar = _local_static_path(d.profile.avatar_url)
    html = env.get_template("portfolio.html").render(
        d=d, p=d.profile, contacts=contacts(d), fmt_date=fmt_date,
        avatar=f"file://{avatar}" if avatar else None,
        font_dir=f"file://{os.path.realpath(FONT_DIR)}",
        css_url=f"file://{os.path.join(TEMPLATE_DIR, 'portfolio.css')}",
    )
    return HTML(string=html, base_url=f"file://{TEMPLATE_DIR}/", url_fetcher=_safe_url_fetcher).write_pdf()


RENDERERS = {"pdf": render_pdf, "docx": render_docx, "md": render_md}
MEDIA_TYPES = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "md": "text/markdown; charset=utf-8",
}
