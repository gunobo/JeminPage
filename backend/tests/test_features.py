"""F1~F5 기능 + 보안 검증."""
import io
import time
from datetime import datetime, timedelta, timezone

import pytest
from jose import jwt


# ─── 마이그레이션 ────────────────────────────────────────────────────────────

def test_migrate_stamps_legacy_db(tmp_path):
    """create_all() 시절 DB(alembic_version 없음)를 baseline으로 stamp 후 새 컬럼 추가, 기존 데이터 보존."""
    from sqlalchemy import create_engine, inspect, text
    url = f"sqlite:///{tmp_path}/legacy.db"
    eng = create_engine(url)
    with eng.begin() as c:
        c.execute(text("CREATE TABLE projects (id INTEGER PRIMARY KEY, title VARCHAR(200) NOT NULL, description TEXT NOT NULL, "
                       "tech_stack JSON, github_url VARCHAR(500), demo_url VARCHAR(500), thumbnail_url VARCHAR(500), "
                       "is_featured BOOLEAN, category VARCHAR(100), created_at DATETIME)"))
        c.execute(text("CREATE TABLE profile (id INTEGER PRIMARY KEY, name VARCHAR(100), tagline VARCHAR(200), bio TEXT, "
                       "github_url VARCHAR(500), email VARCHAR(200), portfolio_url VARCHAR(500), avatar_url VARCHAR(500), "
                       "discord VARCHAR(200), cv_url VARCHAR(500), og_image_url VARCHAR(500), skill_groups JSON, "
                       "yearly_goals JSON, marquee_items JSON)"))
        c.execute(text("INSERT INTO projects (id, title, description, tech_stack, is_featured) VALUES (1, '기존', '설명', '[]', 1)"))
        c.execute(text("INSERT INTO profile (id, name, cv_url) VALUES (1, '임제민', '/static/uploads/cv.pdf')"))

    # 별도 프로세스로 실제 진입점(python -m app.migrate)을 실행 — 테스트 세션 DB와 격리
    import os, subprocess, sys
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out = subprocess.run([sys.executable, "-m", "app.migrate"], cwd=root, capture_output=True, text=True,
                         env={**os.environ, "DATABASE_URL": url})
    assert out.returncode == 0, out.stderr
    assert "stamp" in out.stdout

    insp = inspect(eng)
    cols = {c["name"] for c in insp.get_columns("projects")}
    assert {"period", "team", "role", "problem", "troubleshooting", "results", "sort_order"} <= cols
    assert "awards" in insp.get_table_names()
    with eng.connect() as c:
        assert c.execute(text("SELECT title FROM projects WHERE id=1")).scalar() == "기존"
        assert c.execute(text("SELECT cv_mode FROM profile WHERE id=1")).scalar() == "upload"
        assert c.execute(text("SELECT version_num FROM alembic_version")).scalar() == "0003_profile_education"


# ─── F1 ──────────────────────────────────────────────────────────────────────

def _project(client, auth, **kw):
    body = {"title": "P", "description": "d", "tech_stack": ["Python"], "is_featured": True, **kw}
    r = client.post("/api/projects", json=body, headers=auth)
    assert r.status_code == 200, r.text
    return r.json()


def test_project_case_study_fields(client, auth):
    p = _project(client, auth, title="급식", period="2026.03 ~ 2026.06", team="4인", role="백엔드 리드",
                 problem="문제", troubleshooting="## A\n원인\n## B\n해결", results=["300명", "", "  ", "1.2s → 0.3s"])
    assert p["results"] == ["300명", "1.2s → 0.3s"]  # 빈 줄 제거
    assert p["role"] == "백엔드 리드"

    legacy = _project(client, auth, title="옛날")  # 새 필드 없이도 동작
    assert legacy["period"] is None and legacy["results"] is None

    r = client.put(f"/api/projects/{p['id']}", json={"title": "급식2", "description": "d", "period": ""}, headers=auth)
    assert r.json()["period"] is None  # 빈 문자열 → NULL


def test_project_too_long_field_is_422_not_500(client, auth):
    r = client.post("/api/projects", json={"title": "x", "description": "d", "period": "x" * 101}, headers=auth)
    assert r.status_code == 422


def test_reorder_and_update_keeps_sort_order(client, auth):
    a, b, c = (_project(client, auth, title=t) for t in ("A", "B", "C"))
    r = client.put("/api/projects/order", json={"ids": [c["id"], a["id"], b["id"]]}, headers=auth)
    assert r.status_code == 200
    ids = [p["id"] for p in client.get("/api/projects").json()]
    assert ids.index(c["id"]) < ids.index(a["id"]) < ids.index(b["id"])
    # sort_order 없는(NULL) 프로젝트는 뒤로
    d = _project(client, auth, title="D")
    assert client.get("/api/projects").json()[-1]["id"] == d["id"]
    # 수정 폼은 sort_order를 안 보냄 → 유지돼야 함
    client.put(f"/api/projects/{c['id']}", json={"title": "C2", "description": "d"}, headers=auth)
    assert client.get(f"/api/projects/{c['id']}").json()["sort_order"] == 0


def test_reorder_requires_auth_and_valid_ids(client, auth):
    assert client.put("/api/projects/order", json={"ids": [1]}).status_code == 401
    assert client.put("/api/projects/order", json={"ids": [999999]}, headers=auth).status_code == 400


# ─── F5 ──────────────────────────────────────────────────────────────────────

def test_awards_crud(client, auth):
    p = _project(client, auth, title="출품작")
    body = {"title": "우수상", "competition": "제11회 AI·SW경진대회", "organizer": "KAIST 외",
            "awarded_date": "2026-10-01", "project_id": p["id"], "link_url": "https://example.com/news"}
    assert client.post("/api/awards", json=body).status_code == 401
    a = client.post("/api/awards", json=body, headers=auth).json()
    assert a["project_id"] == p["id"]
    assert client.get("/api/awards").json()[0]["title"] == "우수상"

    body["title"] = "최우수상"
    assert client.put(f"/api/awards/{a['id']}", json=body, headers=auth).json()["title"] == "최우수상"
    assert client.post("/api/awards", json={**body, "project_id": 999999}, headers=auth).status_code == 400
    assert client.delete(f"/api/awards/{a['id']}", headers=auth).status_code == 200
    assert client.get("/api/awards").json() == []


def test_award_link_rejects_javascript_scheme(client, auth):
    r = client.post("/api/awards", json={"title": "x", "competition": "y", "link_url": "javascript:alert(1)"}, headers=auth)
    assert r.status_code == 422


# ─── F2 ──────────────────────────────────────────────────────────────────────

def test_auth_config(client):
    r = client.get("/api/auth/config").json()
    assert r == {"google_client_id": "test-client.apps.googleusercontent.com", "password_login": False}


def _mock_google(monkeypatch, result=None, exc=None):
    from app.auth import google_auth

    def fake(credential, request, audience, clock_skew_in_seconds=0):
        assert audience == "test-client.apps.googleusercontent.com"
        if exc:
            raise exc
        return result

    monkeypatch.setattr(google_auth.id_token, "verify_oauth2_token", fake)


def test_google_login_allowed_email(client, monkeypatch):
    _mock_google(monkeypatch, {"email": "Second@example.com", "email_verified": True, "name": "제민", "picture": "https://p/x.png"})
    r = client.post("/api/auth/google", json={"credential": "tok"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["email"] == "second@example.com" and body["name"] == "제민"
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {body['access_token']}"}).json()
    assert me == {"email": "second@example.com", "name": "제민", "picture": "https://p/x.png"}
    claims = jwt.get_unverified_claims(body["access_token"])
    assert 11.9 * 3600 < claims["exp"] - claims["iat"] <= 12 * 3600


def test_google_login_other_email_403(client, monkeypatch):
    _mock_google(monkeypatch, {"email": "evil@example.com", "email_verified": True})
    r = client.post("/api/auth/google", json={"credential": "tok"})
    assert r.status_code == 403 and r.json()["detail"] == "관리자 계정이 아닙니다"


def test_google_login_unverified_email_401(client, monkeypatch):
    _mock_google(monkeypatch, {"email": "admin@example.com", "email_verified": False})
    assert client.post("/api/auth/google", json={"credential": "tok"}).status_code == 401


def test_google_login_invalid_token_401(client, monkeypatch):
    _mock_google(monkeypatch, exc=ValueError("Token expired"))
    assert client.post("/api/auth/google", json={"credential": "tok"}).status_code == 401


def test_google_login_real_verifier_rejects_garbage(client):
    """목 없이 실제 google-auth 검증기 — 서명 없는 토큰은 401 (네트워크 불필요 단계에서 실패)."""
    fake = jwt.encode({"email": "admin@example.com", "aud": "test-client.apps.googleusercontent.com"}, "x", algorithm="HS256")
    assert client.post("/api/auth/google", json={"credential": fake}).status_code == 401


def test_forged_and_expired_jwt_rejected(client):
    forged = jwt.encode({"sub": "admin", "exp": int(time.time()) + 3600}, "wrong-secret", algorithm="HS256")
    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {forged}"}).status_code == 401
    from app.config import settings
    expired = jwt.encode({"sub": "admin", "exp": int((datetime.now(timezone.utc) - timedelta(minutes=1)).timestamp())},
                         settings.SECRET_KEY, algorithm="HS256")
    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired}"}).status_code == 401
    none_alg = jwt.encode({"sub": "admin"}, "", algorithm="HS256").rsplit(".", 1)[0] + "."
    assert client.post("/api/projects/order", headers={"Authorization": f"Bearer {none_alg}"}).status_code in (401, 405)


def test_password_login_disabled_404(client):
    assert client.post("/api/auth/login", json={"password": "emergency-pass"}).status_code == 404


def test_password_login_enabled_with_rate_limit(client, monkeypatch):
    from app.config import settings
    monkeypatch.setattr(settings, "ALLOW_PASSWORD_LOGIN", True)
    assert client.get("/api/auth/config").json()["password_login"] is True
    hdr = {"X-Real-IP": "10.0.0.9"}
    t0 = time.time()
    assert client.post("/api/auth/login", json={"password": "wrong"}, headers=hdr).status_code == 401
    assert time.time() - t0 >= 0.9  # 실패 지연
    assert client.post("/api/auth/login", json={"password": "emergency-pass"}, headers=hdr).status_code == 200
    for _ in range(3):
        client.post("/api/auth/login", json={"password": "emergency-pass"}, headers=hdr)
    assert client.post("/api/auth/login", json={"password": "emergency-pass"}, headers=hdr).status_code == 429
    # 다른 IP는 영향 없음
    assert client.post("/api/auth/login", json={"password": "emergency-pass"}, headers={"X-Real-IP": "10.0.0.10"}).status_code == 200


# ─── F3 ──────────────────────────────────────────────────────────────────────

def _seed_portfolio(client, auth):
    client.put("/api/profile", json={
        "name": "임제민", "tagline": "백엔드 개발자", "bio": "안녕하세요.\n둘째 줄", "email": "me@example.com",
        "github_url": "https://github.com/example", "skill_groups": [{"category": "백엔드", "skills": ["FastAPI", {"name": "Redis", "desc": ""}]}],
    }, headers=auth)
    p = _project(client, auth, title="급식 알리미 <script>", period="2026.03 ~ 2026.06", team="4인", role="백엔드",
                 problem="급식 정보가 흩어져 있음", troubleshooting="## 메모리 부족\n원인: buffer pool\n해결: 128M\n## 두번째\n...",
                 results=["전교생 300명 사용"], github_url="https://github.com/example/x")
    _project(client, auth, title="비공개 프로젝트", is_featured=False)
    client.post("/api/awards", json={"title": "우수상", "competition": "AI·SW경진대회", "awarded_date": "2026-10-01", "project_id": p["id"]}, headers=auth)
    client.post("/api/organizations", json={"name": "동아리", "role": "부장", "period": "2025.03 ~ 2026.02"}, headers=auth)
    client.post("/api/certifications", json={"name": "정보처리기능사", "issuer": "한국산업인력공단", "acquired_date": "2025-06-01"}, headers=auth)
    return p


def test_export_markdown(client, auth):
    _seed_portfolio(client, auth)
    r = client.get("/api/export/portfolio", params={"format": "md"}, headers=auth)
    assert r.status_code == 200
    assert r.headers["content-type"] == "text/markdown; charset=utf-8"
    cd = r.headers["content-disposition"]
    assert 'filename="imjemin_portfolio.md"' in cd and "filename*=UTF-8''" in cd and "%EC%9E%84%EC%A0%9C%EB%AF%BC" in cd
    md = r.content.decode()
    for s in ("# 임제민", "## 기술 스택", "급식 알리미", "2026.03 ~ 2026.06", "메모리 부족", "전교생 300명", "## 수상", "우수상",
              "## 활동", "## 자격증", "imjemin.co.kr"):
        assert s in md, s
    assert "두번째" not in md  # 대표 트러블슈팅 1개만
    assert "비공개 프로젝트" not in md  # featured scope
    assert "비공개 프로젝트" in client.get("/api/export/portfolio", params={"format": "md", "scope": "all"}, headers=auth).content.decode()


def test_export_cache_invalidated_on_edit(client, auth):
    p = _seed_portfolio(client, auth)
    first = client.get("/api/export/portfolio", params={"format": "md"}, headers=auth).content.decode()
    client.put(f"/api/projects/{p['id']}", json={"title": "새 제목", "description": "d", "is_featured": True}, headers=auth)
    second = client.get("/api/export/portfolio", params={"format": "md"}, headers=auth).content.decode()
    assert "새 제목" in second and first != second
    # 삭제도 반영 (max(updated_at) 방식이 놓치는 경우)
    client.delete(f"/api/projects/{p['id']}", headers=auth)
    third = client.get("/api/export/portfolio", params={"format": "md"}, headers=auth).content.decode()
    assert "새 제목" not in third


def test_export_docx(client, auth):
    _seed_portfolio(client, auth)
    r = client.get("/api/export/portfolio", params={"format": "docx"}, headers=auth)
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    from docx import Document
    text = "\n".join(p.text for p in Document(io.BytesIO(r.content)).paragraphs)
    assert "임제민" in text and "급식 알리미" in text and "우수상" in text and "정보처리기능사" in text


def test_export_pdf(client, auth):
    pytest.importorskip("weasyprint")
    _seed_portfolio(client, auth)
    t0 = time.time()
    r = client.get("/api/export/portfolio", params={"format": "pdf"}, headers=auth)
    elapsed = time.time() - t0
    assert r.status_code == 200, r.text
    assert r.headers["content-type"] == "application/pdf" and r.content[:5] == b"%PDF-"
    from pypdf import PdfReader
    reader = PdfReader(io.BytesIO(r.content))
    text = "".join(pg.extract_text() for pg in reader.pages)
    assert "임제민" in text and "급식" in text and "우수상" in text  # 한글이 실제 글리프로 들어감
    assert "<script>" in text  # 이스케이프되어 텍스트로 출력
    assert 1 <= len(reader.pages) <= 3
    print(f"\n[pdf] pages={len(reader.pages)} size={len(r.content)}B elapsed={elapsed:.2f}s")


def test_export_pdf_blocks_external_urls(migrated):
    """url_fetcher는 로컬 폰트·static 외 접근을 막는다 (SSRF)."""
    pytest.importorskip("weasyprint")
    from app.export.service import _safe_url_fetcher
    for bad in ("http://169.254.169.254/latest/meta-data", "file:///etc/passwd", "https://example.com/x.png"):
        with pytest.raises(ValueError):
            _safe_url_fetcher(bad)


def test_resume_export(client, auth):
    pytest.importorskip("weasyprint")
    # 앞선 테스트가 남긴 프로젝트를 지우고 실제 규모(프로젝트 1~3개)로 1장 여부를 본다
    for pr in client.get("/api/projects").json():
        client.delete(f"/api/projects/{pr['id']}", headers=auth)
    _seed_portfolio(client, auth)
    prof = client.get("/api/profile").json()
    prof["education"] = [{"school": "부산소프트웨어마이스터고", "major": "소프트웨어개발과", "period": "2025.03 ~", "status": "재학"}]
    assert client.put("/api/profile", json=prof, headers=auth).status_code == 200
    assert client.get("/api/profile").json()["education"][0]["status"] == "재학"

    md = client.get("/api/export/portfolio", params={"format": "md", "doc": "resume"}, headers=auth)
    assert md.status_code == 200
    assert "imjemin_resume.md" in md.headers["content-disposition"]
    assert "%EC%9D%B4%EB%A0%A5%EC%84%9C" in md.headers["content-disposition"]  # "이력서"
    text_md = md.content.decode()
    for s in ("## 학력", "부산소프트웨어마이스터고", "## 프로젝트", "급식 알리미", "성과: 전교생 300명 사용", "## 수상", "## 자격증"):
        assert s in text_md, s
    assert "메모리 부족" not in text_md  # 이력서엔 트러블슈팅 없음

    pdf = client.get("/api/export/portfolio", params={"format": "pdf", "doc": "resume"}, headers=auth)
    assert pdf.status_code == 200 and pdf.content[:5] == b"%PDF-"
    from pypdf import PdfReader
    reader = PdfReader(io.BytesIO(pdf.content))
    assert len(reader.pages) == 1
    assert "부산소프트웨어마이스터고" in reader.pages[0].extract_text()

    docx = client.get("/api/export/portfolio", params={"format": "docx", "doc": "resume"}, headers=auth)
    from docx import Document
    assert "부산소프트웨어마이스터고" in "\n".join(p.text for p in Document(io.BytesIO(docx.content)).paragraphs)

    # 포트폴리오와 캐시가 섞이지 않음
    port = client.get("/api/export/portfolio", params={"format": "md"}, headers=auth).content.decode()
    assert "## 학력" not in port and "메모리 부족" in port


def test_resume_requires_admin(client):
    assert client.get("/api/export/portfolio", params={"format": "pdf", "doc": "resume"}).status_code == 401


def test_education_validation(client, auth):
    prof = client.get("/api/profile").json()
    prof["education"] = [{"school": "x" * 201}]
    assert client.put("/api/profile", json=prof, headers=auth).status_code == 422


def test_export_requires_admin(client):
    r = client.get("/api/export/portfolio", params={"format": "md"})
    assert r.status_code == 401
    bad = {"Authorization": "Bearer not-a-jwt"}
    assert client.get("/api/export/portfolio", params={"format": "md"}, headers=bad).status_code == 401


def test_export_rate_limit(client, auth):
    hdr = {"X-Real-IP": "10.1.1.1", **auth}
    codes = [client.get("/api/export/portfolio", params={"format": "md"}, headers=hdr).status_code for _ in range(6)]
    assert codes[:5] == [200] * 5 and codes[5] == 429


def test_export_rejects_bad_format(client, auth):
    assert client.get("/api/export/portfolio", params={"format": "exe"}, headers=auth).status_code == 422


# ─── F4 ──────────────────────────────────────────────────────────────────────

def test_meta_project_and_escaping(client, auth):
    client.put("/api/profile", json={"name": "임제민", "tagline": 'dev"><script>alert(1)</script>', "bio": "소개"}, headers=auth)
    p = _project(client, auth, title='악성"><img src=x onerror=alert(1)>', description="가" * 200, thumbnail_url="/static/uploads/t.png")

    m = client.get("/api/meta", params={"path": f"/projects/{p['id']}"}).json()
    assert m["url"] == f"https://imjemin.co.kr/projects/{p['id']}"
    assert m["image"] == "https://imjemin.co.kr/static/uploads/t.png"
    assert len(m["description"]) <= 120

    html = client.get("/api/meta/ssi", headers={"X-Original-URI": f"/projects/{p['id']}?utm=1"}).text
    assert "<img" not in html and "&quot;&gt;&lt;img" in html
    assert 'property="og:type" content="article"' in html

    home = client.get("/api/meta/ssi", headers={"X-Original-URI": "/"}).text
    assert "<script>alert" not in home
    assert home.count("<script") == 1 and 'application/ld+json' in home  # JSON-LD 하나만, 탈출 불가
    assert "\\u003c/script\\u003e" in home
    assert client.get("/api/meta", params={"path": "/nope"}).json()["url"] == "https://imjemin.co.kr/"
    # 구버전 엔드포인트도 이스케이프됨
    assert "<script>alert" not in client.get("/api/profile/og-meta").text


def test_sitemap(client, auth):
    p = _project(client, auth, title="S")
    client.post("/api/blog", json={"title": "글", "slug": "한글-슬러그", "content": "c", "is_published": True}, headers=auth)
    client.post("/api/blog", json={"title": "비공개", "slug": "draft", "content": "c", "is_published": False}, headers=auth)
    r = client.get("/api/seo/sitemap.xml")
    assert r.headers["content-type"].startswith("application/xml")
    assert f"https://imjemin.co.kr/projects/{p['id']}" in r.text
    assert "%ED%95%9C%EA%B8%80" in r.text and "draft" not in r.text


# ─── 기존 코드 보안 보강 ──────────────────────────────────────────────────────

def test_upload_rejects_disguised_html(client, auth):
    r = client.post("/api/uploads", headers=auth,
                    files={"file": ("x.html", b"<script>alert(1)</script>", "image/png")})
    assert r.status_code == 400
    from PIL import Image
    buf = io.BytesIO(); Image.new("RGB", (8, 8)).save(buf, "PNG"); png = buf.getvalue()
    r = client.post("/api/uploads", headers=auth, files={"file": ("evil.html", png, "image/png")})
    assert r.status_code == 200 and r.json()["url"].endswith(".png")


def test_otp_bruteforce_limited(client, redis_client, monkeypatch):
    from app.contact import router as contact_router
    monkeypatch.setattr(contact_router, "send_otp_email", lambda *a, **k: None)
    hdr = {"X-Real-IP": "10.2.2.2"}
    assert client.post("/api/contact/otp/send", json={"email": "v@example.com"}, headers=hdr).status_code == 200
    real = redis_client.get("otp:v@example.com")
    codes = [client.post("/api/contact/otp/verify", json={"email": "v@example.com", "otp": "000000"}, headers=hdr).status_code
             for _ in range(5)]
    assert codes == [400] * 5
    # 6번째는 정답이어도 차단 + 코드 폐기
    assert client.post("/api/contact/otp/verify", json={"email": "v@example.com", "otp": real}, headers=hdr).status_code == 429
    assert redis_client.get("otp:v@example.com") is None
    # 비ASCII 입력도 500이 아니라 400
    client.post("/api/contact/otp/send", json={"email": "w@example.com"}, headers=hdr)
    assert client.post("/api/contact/otp/verify", json={"email": "w@example.com", "otp": "한글"}, headers=hdr).status_code == 400


def test_resume_summary_does_not_cut_mid_sentence():
    from app.export.resume import _summary
    tp = ("VS Code 확장 프로그램으로, 팀원들의 실시간 코딩 활동을 사이드바에서 확인할 수 있어요. "
          "GitHub OAuth 인증과 방 코드 시스템으로 팀을 구성하고, 서로 어떤 파일을 편집 중인지 실시간으로 공유할 수 있습니다.")
    assert _summary(tp, 160) == tp  # 짧으면 전체
    assert _summary(tp, 80) == "VS Code 확장 프로그램으로, 팀원들의 실시간 코딩 활동을 사이드바에서 확인할 수 있어요."  # 완결된 문장까지
    assert _summary("가" * 300, 160).endswith("…")  # 문장 하나가 너무 길 때만 …


# ─── 업로드 형식 판별 ─────────────────────────────────────────────────────────

def _img_bytes(fmt, size=(64, 64), mode="RGB", noise=False):
    import os as _os
    from PIL import Image
    if noise:
        im = Image.frombytes(mode, size, _os.urandom(size[0] * size[1] * len(mode)))
    else:
        im = Image.new(mode, size, (200, 30, 30, 128) if mode == "RGBA" else (200, 30, 30))
    buf = io.BytesIO()
    im.save(buf, fmt)
    return buf.getvalue()


def _static_file(url):
    import os as _os
    from app.config import settings
    return _os.path.join(settings.STATIC_DIR, url[len("/static/"):])


def test_upload_png_with_wrong_content_type(client, auth):
    """이름·Content-Type은 jpg인데 내용은 PNG → 내용대로 .png 로 저장."""
    r = client.post("/api/uploads", headers=auth, files={"file": ("photo.jpg", _img_bytes("PNG"), "image/jpeg")})
    assert r.status_code == 200, r.text
    assert r.json()["url"].endswith(".png")


def test_upload_large_photo_is_shrunk(client, auth):
    big = _img_bytes("PNG", size=(3000, 2200), noise=True)  # 노이즈 PNG ≈ 20MB
    assert 10 * 1024 * 1024 < len(big) <= 25 * 1024 * 1024
    r = client.post("/api/uploads", headers=auth, files={"file": ("big.png", big, "image/png")})
    assert r.status_code == 200, r.text
    url = r.json()["url"]
    assert url.endswith(".jpg")  # 투명도 없음 → JPEG
    from PIL import Image
    im = Image.open(_static_file(url))
    assert max(im.size) <= 2560


def test_upload_transparent_png_keeps_alpha(client, auth):
    png = _img_bytes("PNG", size=(3000, 3000), mode="RGBA")  # 용량은 작지만 긴 변이 2560 초과
    r = client.post("/api/uploads", headers=auth, files={"file": ("cutout.png", png, "image/png")})
    assert r.status_code == 200, r.text
    from PIL import Image
    im = Image.open(_static_file(r.json()["url"]))
    assert r.json()["url"].endswith(".png") and im.mode == "RGBA" and max(im.size) <= 2560


def test_upload_small_image_untouched(client, auth):
    data = _img_bytes("JPEG")
    r = client.post("/api/uploads", headers=auth, files={"file": ("a.jpeg", data, "image/jpeg")})
    assert open(_static_file(r.json()["url"]), "rb").read() == data


def test_upload_heic_converted(client, auth):
    pillow_heif = pytest.importorskip("pillow_heif")
    from PIL import Image
    pillow_heif.register_heif_opener()
    buf = io.BytesIO()
    Image.new("RGB", (120, 80), (10, 120, 200)).save(buf, "HEIF")
    r = client.post("/api/uploads", headers=auth, files={"file": ("IMG_0001.HEIC", buf.getvalue(), "image/heic")})
    assert r.status_code == 200, r.text
    url = r.json()["url"]
    assert url.endswith(".jpg") and Image.open(_static_file(url)).size == (120, 80)


def test_upload_rejects_unknown_and_too_big(client, auth):
    r = client.post("/api/uploads", headers=auth, files={"file": ("x.png", b"<svg onload=alert(1)>", "image/png")})
    assert r.status_code == 400 and "올릴 수 있습니다" in r.json()["detail"]
    huge = b"%PDF-" + b"0" * (25 * 1024 * 1024)
    r = client.post("/api/uploads", headers=auth, files={"file": ("cv.pdf", huge, "application/pdf")})
    assert r.status_code == 400 and "25MB" in r.json()["detail"]
    ok = client.post("/api/uploads", headers=auth, files={"file": ("cv.pdf", b"%PDF-1.4 test", "application/pdf")})
    assert ok.status_code == 200 and ok.json()["url"].endswith(".pdf")
