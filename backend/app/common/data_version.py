"""포트폴리오 문서 캐시 무효화용 데이터 버전.

명세는 '가장 최근 수정 시각'을 버전으로 쓰자고 했지만, 그 방식은 **삭제**를 감지하지 못한다
(행이 사라지면 max(updated_at)가 그대로이거나 오히려 과거로 간다).
대신 profile·projects·awards·organizations·certifications 행이 추가/수정/삭제되어
커밋될 때마다 Redis 카운터를 1 올린다. 캐시 키에 이 값이 들어가므로 수정 즉시 새 문서가 생성된다.
"""
from sqlalchemy import event
from sqlalchemy.orm import Session

from ..stats.service import get_redis

KEY = "export:data_version"
TRACKED_TABLES = {"profile", "projects", "awards", "organizations", "certifications"}


def current() -> str:
    r = get_redis()
    if not r:
        return "0"
    try:
        return r.get(KEY) or "0"
    except Exception:
        return "0"


def bump() -> None:
    r = get_redis()
    if not r:
        return
    try:
        r.incr(KEY)
    except Exception:
        pass


@event.listens_for(Session, "after_flush")
def _mark_dirty(session: Session, _ctx) -> None:
    for obj in (*session.new, *session.dirty, *session.deleted):
        if getattr(obj, "__tablename__", None) in TRACKED_TABLES:
            session.info["export_dirty"] = True
            return


@event.listens_for(Session, "after_commit")
def _bump_on_commit(session: Session) -> None:
    if session.info.pop("export_dirty", False):
        bump()


@event.listens_for(Session, "after_rollback")
def _clear_on_rollback(session: Session) -> None:
    session.info.pop("export_dirty", None)
