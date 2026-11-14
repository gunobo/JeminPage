from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, Header
from jose import jwt

from ..config import settings

ALGORITHM = "HS256"


def create_token(email: str = "admin", name: str = "", picture: str = "") -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": email,
        "email": email,
        "name": name,
        "picture": picture,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=settings.JWT_EXPIRE_HOURS)).timestamp()),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        return None


def verify_token(token: str) -> bool:
    return decode_token(token) is not None


def current_admin(authorization: str = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    claims = decode_token(authorization[7:])
    if claims is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    return claims


def require_auth(authorization: str = Header(None)):
    current_admin(authorization)
