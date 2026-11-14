"""Google Identity Services ID 토큰 검증."""
from fastapi import HTTPException
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from ..config import settings

_request = google_requests.Request()


def verify_google_credential(credential: str) -> dict:
    """서명·aud·iss·exp를 검증하고 관리자 이메일인지 확인. 실패 시 401/403."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google 로그인이 설정되지 않았습니다")

    try:
        # aud == GOOGLE_CLIENT_ID, iss ∈ {accounts.google.com, https://accounts.google.com}, exp 확인
        info = id_token.verify_oauth2_token(credential, _request, settings.GOOGLE_CLIENT_ID, clock_skew_in_seconds=10)
    except ValueError:
        raise HTTPException(status_code=401, detail="유효하지 않은 Google 토큰입니다")
    except Exception:
        # 구글 공개키 조회 실패 등
        raise HTTPException(status_code=401, detail="Google 토큰을 검증할 수 없습니다")

    if info.get("email_verified") is not True:
        raise HTTPException(status_code=401, detail="이메일 인증이 안 된 Google 계정입니다")

    email = str(info.get("email", "")).lower()
    if not email or email not in settings.admin_emails:
        raise HTTPException(status_code=403, detail="관리자 계정이 아닙니다")

    return {"email": email, "name": info.get("name", "") or "", "picture": info.get("picture", "") or ""}
