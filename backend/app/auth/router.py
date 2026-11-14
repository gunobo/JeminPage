import asyncio
import hmac

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from ..common.ratelimit import client_ip, hit, rate_limit
from ..config import settings
from .google_auth import verify_google_credential
from .utils import create_token, current_admin

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    password: str = Field(max_length=256)


class GoogleLoginRequest(BaseModel):
    credential: str = Field(min_length=1, max_length=4096)


@router.get("/config")
def auth_config():
    """로그인 화면이 어떤 방식을 보여줄지 결정하는 공개 설정."""
    return {
        "google_client_id": settings.GOOGLE_CLIENT_ID,
        "password_login": settings.ALLOW_PASSWORD_LOGIN and bool(settings.ADMIN_PASSWORD),
    }


@router.post("/google", dependencies=[Depends(rate_limit("google_login", 10))])
async def google_login(body: GoogleLoginRequest):
    # verify_oauth2_token은 동기 HTTP 호출(공개키 조회)을 하므로 스레드풀에서
    user = await run_in_threadpool(verify_google_credential, body.credential)
    return {"access_token": create_token(user["email"], user["name"], user["picture"]), **user}


@router.get("/me")
def me(claims: dict = Depends(current_admin)):
    return {
        "email": claims.get("email") or claims.get("sub", ""),
        "name": claims.get("name", ""),
        "picture": claims.get("picture", ""),
    }


@router.post("/login")
async def login(body: LoginRequest, request: Request):
    """비상용 비밀번호 로그인. ALLOW_PASSWORD_LOGIN=false면 존재하지 않는 것처럼 404."""
    if not settings.ALLOW_PASSWORD_LOGIN or not settings.ADMIN_PASSWORD:
        raise HTTPException(status_code=404, detail="Not Found")

    if not hit(f"rl:pw_login:{client_ip(request)}", limit=5, window=60):
        raise HTTPException(status_code=429, detail="요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", headers={"Retry-After": "60"})

    if not hmac.compare_digest(body.password.encode(), settings.ADMIN_PASSWORD.encode()):
        await asyncio.sleep(1.0)  # 실패 시 지연 응답
        raise HTTPException(status_code=401, detail="Invalid password")

    return {"access_token": create_token("admin", "비상 로그인", ""), "email": "admin", "name": "비상 로그인", "picture": ""}
