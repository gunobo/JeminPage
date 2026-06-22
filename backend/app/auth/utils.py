from jose import jwt
from datetime import datetime, timedelta
from fastapi import HTTPException, Header
from ..config import settings

ALGORITHM = "HS256"

def create_token() -> str:
    payload = {"exp": datetime.utcnow() + timedelta(days=1), "sub": "admin"}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> bool:
    try:
        jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return True
    except Exception:
        return False

def require_auth(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    if not verify_token(authorization[7:]):
        raise HTTPException(status_code=401, detail="Invalid token")
