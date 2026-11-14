"""테스트 환경: SQLite 파일 DB + 로컬 Redis(DB 15).

실행:
  REDIS_URL=redis://localhost:6379/15 EXPORT_FONT_DIR=/path/to/fonts pytest -q
"""
import os
import sys
import tempfile

import pytest

_tmp = tempfile.mkdtemp(prefix="jeminpage-test-")
os.environ.setdefault("DATABASE_URL", f"sqlite:///{_tmp}/test.db")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/15")
os.environ.setdefault("SECRET_KEY", "test-secret-key-0123456789abcdef0123456789")
os.environ.setdefault("STATIC_DIR", os.path.join(_tmp, "static"))
os.environ["GOOGLE_CLIENT_ID"] = "test-client.apps.googleusercontent.com"
os.environ["ADMIN_EMAILS"] = "admin@example.com, Second@Example.com"
os.environ["ALLOW_PASSWORD_LOGIN"] = "false"
os.environ["ADMIN_PASSWORD"] = "emergency-pass"
os.makedirs(os.path.join(os.environ["STATIC_DIR"], "uploads"), exist_ok=True)

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@pytest.fixture(scope="session")
def migrated():
    from app import migrate
    migrate.main()
    return True


@pytest.fixture()
def redis_client():
    import redis
    r = redis.from_url(os.environ["REDIS_URL"], decode_responses=True)
    try:
        r.ping()
    except Exception:
        pytest.skip("Redis not available")
    r.flushdb()
    yield r
    r.flushdb()


@pytest.fixture()
def client(migrated, redis_client):
    from fastapi.testclient import TestClient
    from app.main import app
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def token():
    from app.auth.utils import create_token
    return create_token("admin@example.com", "관리자", "")


@pytest.fixture()
def auth(token):
    return {"Authorization": f"Bearer {token}"}
