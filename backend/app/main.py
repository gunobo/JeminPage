import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from . import models_registry  # noqa: F401  모든 모델 등록
from .common import data_version  # noqa: F401  export 캐시 무효화 리스너 등록
from .config import settings
from .auth.router import router as auth_router
from .projects.router import router as projects_router
from .contact.router import router as contact_router
from .stats.router import router as stats_router
from .uploads.router import router as uploads_router
from .profile.router import router as profile_router
from .blog.router import router as blog_router
from .organizations.router import router as organizations_router
from .certifications.router import router as certifications_router
from .velog.router import router as velog_router
from .awards.router import router as awards_router
from .export.router import router as export_router
from .seo.router import router as seo_router

# 스키마는 Alembic이 관리한다 (컨테이너 시작 시 `python -m app.migrate`).
# create_all()은 기존 테이블에 새 컬럼을 추가하지 못하므로 더 이상 쓰지 않는다.

UPLOAD_DIR = os.path.join(settings.STATIC_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="Portfolio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # Bearer 토큰 방식이라 쿠키 자격 증명은 필요 없다
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=settings.STATIC_DIR), name="static")

for r in (auth_router, projects_router, contact_router, stats_router, uploads_router, profile_router,
          blog_router, organizations_router, certifications_router, velog_router, awards_router,
          export_router, seo_router):
    app.include_router(r, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}
