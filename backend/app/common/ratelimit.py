"""Redis 기반 고정 윈도우 요청 제한 (INCR + EXPIRE)."""
from fastapi import HTTPException, Request
from ..stats.service import get_redis


def client_ip(request: Request) -> str:
    # nginx가 CF-Connecting-IP(없으면 remote_addr)를 X-Real-IP로 넘긴다.
    # 백엔드 포트는 외부에 노출되지 않으므로 이 헤더는 nginx만 설정할 수 있다.
    ip = request.headers.get("x-real-ip") or (request.client.host if request.client else "")
    return ip.strip()[:64] or "unknown"


def hit(key: str, limit: int, window: int) -> bool:
    """요청 1회를 기록하고, 한도 이내면 True. Redis가 없으면 제한하지 않는다(fail-open)."""
    r = get_redis()
    if not r:
        return True
    try:
        pipe = r.pipeline()
        pipe.incr(key)
        pipe.expire(key, window, nx=True)
        count, _ = pipe.execute()
        return int(count) <= limit
    except Exception:
        return True


def rate_limit(scope: str, limit: int, window: int = 60):
    """FastAPI 의존성: IP당 window초에 limit회. 초과 시 429."""

    def dep(request: Request):
        if not hit(f"rl:{scope}:{client_ip(request)}", limit, window):
            raise HTTPException(
                status_code=429,
                detail="요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
                headers={"Retry-After": str(window)},
            )

    return dep
