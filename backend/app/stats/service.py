import redis as redis_lib
from datetime import date
from sqlalchemy.orm import Session
from ..config import settings
from .models import VisitorDay

_client: redis_lib.Redis | None = None


def get_redis() -> redis_lib.Redis | None:
    global _client
    if _client is None:
        try:
            _client = redis_lib.from_url(settings.REDIS_URL, decode_responses=True, socket_connect_timeout=2)
            _client.ping()
        except Exception:
            _client = None
    return _client


def record_visit(db: Session):
    today = date.today()
    row = db.query(VisitorDay).filter(VisitorDay.day == today).first()
    if row:
        row.count += 1
    else:
        row = VisitorDay(day=today, count=1)
        db.add(row)
    db.commit()

    r = get_redis()
    if r:
        try:
            r.incr("visits:total")
            r.incr(f"visits:{today.isoformat()}")
        except Exception:
            pass


def get_stats(db: Session) -> dict:
    today = date.today()
    rows = db.query(VisitorDay).all()
    total = sum(r.count for r in rows)
    today_row = next((r for r in rows if r.day == today), None)
    return {
        "total": total,
        "today": today_row.count if today_row else 0,
    }


def get_daily_stats(db: Session, days: int = 30) -> list[dict]:
    from datetime import timedelta
    today = date.today()
    rows = db.query(VisitorDay).filter(
        VisitorDay.day >= today - timedelta(days=days - 1)
    ).order_by(VisitorDay.day).all()
    row_map = {r.day: r.count for r in rows}
    return [
        {"date": (today - timedelta(days=days - 1 - i)).isoformat(),
         "count": row_map.get(today - timedelta(days=days - 1 - i), 0)}
        for i in range(days)
    ]


def reset_stats(db: Session):
    db.query(VisitorDay).delete()
    db.commit()
    r = get_redis()
    if r:
        try:
            keys = r.keys("visits:*")
            if keys:
                r.delete(*keys)
        except Exception:
            pass
