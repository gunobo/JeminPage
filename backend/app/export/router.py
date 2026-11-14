import logging
from datetime import date
from typing import Literal
from urllib.parse import quote

import redis as redis_lib
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from ..common import data_version
from ..common.ratelimit import rate_limit
from ..config import settings
from ..database import get_db
from ..profile.models import Profile
from .service import MEDIA_TYPES, RENDERERS, collect

router = APIRouter(prefix="/export", tags=["export"])
log = logging.getLogger("export")

CACHE_TTL = 60 * 60 * 24

_bin: redis_lib.Redis | None = None


def _cache() -> redis_lib.Redis:
    """바이너리(PDF/DOCX)를 저장하므로 decode_responses=False 클라이언트를 따로 쓴다."""
    global _bin
    if _bin is None:
        _bin = redis_lib.from_url(settings.REDIS_URL, decode_responses=False, socket_connect_timeout=2, socket_timeout=2)
    return _bin


def _cache_get(key: str) -> bytes | None:
    try:
        return _cache().get(key)
    except Exception:
        return None


def _cache_set(key: str, body: bytes) -> None:
    try:
        _cache().setex(key, CACHE_TTL, body)
    except Exception:
        pass


def _disposition(name: str, fmt: str) -> str:
    today = date.today().strftime("%Y%m%d")
    utf8 = f"{name}_포트폴리오_{today}.{fmt}"
    return f"attachment; filename=\"imjemin_portfolio.{fmt}\"; filename*=UTF-8''{quote(utf8, safe='')}"


@router.get("/portfolio", dependencies=[Depends(rate_limit("export", 5))])
async def export_portfolio(
    format: Literal["pdf", "docx", "md"] = Query("pdf"),
    scope: Literal["featured", "all"] = Query("featured"),
    db: Session = Depends(get_db),
):
    key = f"export:{format}:{scope}:{data_version.current()}"
    body = _cache_get(key)

    if body is None:
        data = collect(db, scope)
        try:
            body = await run_in_threadpool(RENDERERS[format], data)
        except Exception as e:
            log.exception("portfolio export failed (format=%s)", format)
            raise HTTPException(status_code=500, detail="문서 생성에 실패했습니다") from e
        _cache_set(key, body)

    profile = db.get(Profile, 1)
    name = profile.name.strip() if profile and profile.name and profile.name.strip() else "portfolio"
    return Response(
        content=body,
        media_type=MEDIA_TYPES[format],
        headers={
            "Content-Disposition": _disposition(name, format),
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
        },
    )
