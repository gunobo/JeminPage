import redis as redis_lib
from datetime import date
from ..config import settings

_client: redis_lib.Redis | None = None

def get_redis() -> redis_lib.Redis:
    global _client
    if _client is None:
        _client = redis_lib.from_url(settings.REDIS_URL, decode_responses=True)
    return _client

def record_visit():
    r = get_redis()
    today = date.today().isoformat()
    r.incr("visits:total")
    r.incr(f"visits:{today}")

def get_stats() -> dict:
    r = get_redis()
    today = date.today().isoformat()
    return {
        "total": int(r.get("visits:total") or 0),
        "today": int(r.get(f"visits:{today}") or 0),
    }
