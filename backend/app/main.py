import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import Base, engine
from .stats.service import record_visit
from .auth.router import router as auth_router
from .projects.router import router as projects_router
from .contact.router import router as contact_router
from .stats.router import router as stats_router
from .uploads.router import router as uploads_router
from .profile.router import router as profile_router

# import all models so SQLAlchemy registers them before create_all
from .projects import models as _pm  # noqa: F401
from .contact import models as _cm  # noqa: F401
from .profile import models as _prm  # noqa: F401

Base.metadata.create_all(bind=engine)

UPLOAD_DIR = "/app/static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="Portfolio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="/app/static"), name="static")

@app.middleware("http")
async def count_visits(request: Request, call_next):
    if not request.url.path.startswith("/api") and not request.url.path.startswith("/static"):
        try:
            record_visit()
        except Exception:
            pass
    return await call_next(request)

app.include_router(auth_router, prefix="/api")
app.include_router(projects_router, prefix="/api")
app.include_router(contact_router, prefix="/api")
app.include_router(stats_router, prefix="/api")
app.include_router(uploads_router, prefix="/api")
app.include_router(profile_router, prefix="/api")

@app.get("/api/health")
def health():
    return {"status": "ok"}
