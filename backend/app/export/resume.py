"""이력서 (A4 1장) — 포트폴리오와 같은 데이터를 요약해서 보여 준다."""
from __future__ import annotations

import io
import os
import re
from typing import Any

from .service import (
    FONT_DIR, TEMPLATE_DIR, PortfolioData, _local_static_path, _safe_url_fetcher, contacts, fmt_date,
)


def _clip(text: str, n: int) -> str:
    t = re.sub(r"\s+", " ", text or "").strip()
    return t if len(t) <= n else t[: n - 1].rstrip() + "…"


def _education(d: PortfolioData) -> list[dict[str, str]]:
    rows = []
    for e in d.profile.education or []:
        if isinstance(e, dict) and str(e.get("school", "")).strip():
            rows.append({k: str(e.get(k, "") or "").strip() for k in ("school", "major", "period", "status")})
    return rows


def _projects(d: PortfolioData) -> list[dict[str, Any]]:
    out = []
    for p in d.projects:
        first_line = (p["description"] or "").splitlines()[0] if p["description"] else ""
        out.append({
            "title": p["title"],
            "period": p["period"],
            "role": p["role"],
            "summary": _clip(first_line, 90),
            "result": p["results"][0] if p["results"] else "",
            "stack": ", ".join(p["tech_stack"][:5]),
            "awards": p["awards"],
        })
    return out


def _context(d: PortfolioData) -> dict[str, Any]:
    p = d.profile
    return {
        "d": d, "p": p, "contacts": contacts(d), "fmt_date": fmt_date,
        "bio": _clip(p.bio or "", 220),
        "education": _education(d),
        "projects": _projects(d),
    }


# ─── PDF ──────────────────────────────────────────────────────────────────────

def render_resume_pdf(d: PortfolioData) -> bytes:
    from jinja2 import Environment, FileSystemLoader, select_autoescape
    from weasyprint import HTML

    env = Environment(loader=FileSystemLoader(TEMPLATE_DIR), autoescape=select_autoescape(["html"]))
    avatar = _local_static_path(d.profile.avatar_url)
    html = env.get_template("resume.html").render(
        **_context(d),
        avatar=f"file://{avatar}" if avatar else None,
        font_dir=f"file://{os.path.realpath(FONT_DIR)}",
        css_url=f"file://{os.path.join(TEMPLATE_DIR, 'resume.css')}",
    )
    return HTML(string=html, base_url=f"file://{TEMPLATE_DIR}/", url_fetcher=_safe_url_fetcher).write_pdf()


# ─── Markdown ─────────────────────────────────────────────────────────────────

def render_resume_md(d: PortfolioData) -> bytes:
    c = _context(d)
    p = d.profile
    L = [f"# {p.name or '이력서'}"]
    if p.tagline:
        L.append(f"**{p.tagline}**")
    L += ["", " · ".join(f"{k}: {v}" for k, v in c["contacts"]), ""]
    if c["bio"]:
        L += [c["bio"], ""]
    if c["education"]:
        L += ["## 학력", ""]
        L += [f"- {' · '.join(x for x in (e['period'], e['school'], e['major'], e['status']) if x)}" for e in c["education"]]
        L.append("")
    if d.skill_groups:
        L += ["## 기술", ""] + [f"- **{g['category']}**: {', '.join(g['skills'])}" for g in d.skill_groups] + [""]
    if c["projects"]:
        L += ["## 프로젝트", ""]
        for pr in c["projects"]:
            head = " · ".join(x for x in (pr["period"], f"**{pr['title']}**", pr["role"]) if x)
            L.append(f"- {head}")
            if pr["summary"]:
                L.append(f"  - {pr['summary']}")
            if pr["result"]:
                L.append(f"  - 성과: {pr['result']}")
            if pr["awards"]:
                L.append(f"  - 수상: {', '.join(pr['awards'])}")
        L.append("")
    for title, rows in (
        ("수상", [" · ".join(x for x in (a["date"], a["competition"], a["title"]) if x) for a in d.awards]),
        ("활동", [" · ".join(x for x in (o.period, o.name, o.role) if x) for o in d.orgs]),
        ("자격증", [" · ".join(x for x in (fmt_date(x.acquired_date), x.name, x.issuer) if x) for x in d.certs]),
    ):
        if rows:
            L += [f"## {title}", ""] + [f"- {r}" for r in rows] + [""]
    L += ["---", f"{d.generated.isoformat()} · {d.site_host}", ""]
    return "\n".join(L).encode("utf-8")


# ─── DOCX ─────────────────────────────────────────────────────────────────────

def render_resume_docx(d: PortfolioData) -> bytes:
    from docx import Document
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.oxml.ns import qn
    from docx.shared import Mm, Pt, RGBColor

    FONT = "맑은 고딕"
    GRAY = RGBColor(0x66, 0x66, 0x66)
    c = _context(d)
    p = d.profile

    doc = Document()
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Mm(210), Mm(297)
    for side in ("left_margin", "right_margin", "top_margin", "bottom_margin"):
        setattr(sec, side, Mm(15))

    def font(target, size=None, bold=None, color=None):
        f = target.font
        f.name = FONT
        if size:
            f.size = Pt(size)
        if bold is not None:
            f.bold = bold
        if color is not None:
            f.color.rgb = color
        rpr = target.element.get_or_add_rPr()
        rf = rpr.find(qn("w:rFonts"))
        if rf is None:
            rf = rpr.makeelement(qn("w:rFonts"), {})
            rpr.append(rf)
        for a in ("w:ascii", "w:hAnsi", "w:eastAsia", "w:cs"):
            rf.set(qn(a), FONT)

    font(doc.styles["Normal"], 9.5)
    font(doc.styles["Heading 1"], 11.5, True, RGBColor(0x11, 0x11, 0x11))

    def line(text="", size=9.5, bold=False, color=None, after=1):
        para = doc.add_paragraph()
        para.paragraph_format.space_after = Pt(after)
        if text:
            font(para.add_run(text), size, bold, color)
        return para

    def row(left: str, main: str, sub: str = ""):
        para = doc.add_paragraph()
        para.paragraph_format.space_after = Pt(1)
        para.paragraph_format.tab_stops.add_tab_stop(Mm(30))
        font(para.add_run(f"{left}\t"), 8.5, False, GRAY)
        font(para.add_run(main), 9.5, True)
        if sub:
            font(para.add_run(f"  {sub}"), 9, False, GRAY)
        return para

    title = doc.add_paragraph()
    font(title.add_run(p.name or "이력서"), 20, True)
    if p.tagline:
        line(p.tagline, 10.5, color=GRAY)
    line(" · ".join(f"{k}: {v}" for k, v in c["contacts"]), 8.5, color=GRAY, after=6)
    if c["bio"]:
        line(c["bio"], 9.5, after=6)

    if c["education"]:
        doc.add_heading("학력", level=1)
        for e in c["education"]:
            row(e["period"], e["school"], " · ".join(x for x in (e["major"], e["status"]) if x))
    if d.skill_groups:
        doc.add_heading("기술", level=1)
        for g in d.skill_groups:
            row(g["category"], ", ".join(g["skills"]))
    if c["projects"]:
        doc.add_heading("프로젝트", level=1)
        for pr in c["projects"]:
            row(pr["period"], pr["title"], pr["role"])
            for extra in (pr["summary"], f"성과: {pr['result']}" if pr["result"] else "",
                          f"수상: {', '.join(pr['awards'])}" if pr["awards"] else ""):
                if extra:
                    para = line(extra, 9)
                    para.paragraph_format.left_indent = Mm(30)
    for heading, rows in (
        ("수상", [(a["date"], a["title"], a["competition"]) for a in d.awards]),
        ("활동", [(o.period or "", o.name, o.role or "") for o in d.orgs]),
        ("자격증", [(fmt_date(x.acquired_date), x.name, x.issuer or "") for x in d.certs]),
    ):
        if rows:
            doc.add_heading(heading, level=1)
            for left, main, sub in rows:
                row(left, main, sub)

    foot = sec.footer.paragraphs[0]
    foot.alignment = WD_ALIGN_PARAGRAPH.CENTER
    font(foot.add_run(f"{d.generated.isoformat()} · {d.site_host}"), 8, color=GRAY)

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


RESUME_RENDERERS = {"pdf": render_resume_pdf, "docx": render_resume_docx, "md": render_resume_md}
