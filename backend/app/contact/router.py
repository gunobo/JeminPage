import hmac
import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth.utils import require_auth
from ..stats.service import get_redis
from ..common.ratelimit import hit, rate_limit
from .models import ContactMessage
from .schemas import ContactForm, ContactMessageOut, OTPRequest, OTPVerify
from .service import send_otp_email, send_contact_email

router = APIRouter(prefix="/contact", tags=["contact"])

OTP_TTL = 300       # OTP 유효 5분
TOKEN_TTL = 1800    # 인증 토큰 유효 30분

OTP_MAX_ATTEMPTS = 5  # 코드 1개당 검증 시도 횟수


@router.post("/otp/send", dependencies=[Depends(rate_limit("otp_send", 3, 600))])
def send_otp(body: OTPRequest):
    r = get_redis()
    if not r:
        raise HTTPException(status_code=503, detail="Redis unavailable")
    # 같은 주소로 메일 폭탄 방지: 이메일당 10분에 3회
    if not hit(f"rl:otp_send_email:{body.email.lower()}", 3, 600):
        raise HTTPException(status_code=429, detail="요청이 너무 많습니다. 잠시 후 다시 시도해주세요.")
    otp = f"{secrets.randbelow(900000) + 100000}"
    r.delete(f"otp_attempts:{body.email}")
    r.setex(f"otp:{body.email}", OTP_TTL, otp)
    try:
        send_otp_email(body.email, otp)
    except Exception:
        # 내부 오류 메시지(SMTP 정보 등)는 응답에 노출하지 않는다
        raise HTTPException(status_code=500, detail="이메일 발송에 실패했습니다.")
    return {"ok": True}

@router.post("/otp/verify", dependencies=[Depends(rate_limit("otp_verify", 20, 600))])
def verify_otp(body: OTPVerify):
    r = get_redis()
    if not r:
        raise HTTPException(status_code=503, detail="Redis unavailable")
    # 6자리 코드 무차별 대입 방지: 코드 1개당 5회까지, 초과하면 코드 폐기
    attempts = r.incr(f"otp_attempts:{body.email}")
    r.expire(f"otp_attempts:{body.email}", OTP_TTL)
    if attempts > OTP_MAX_ATTEMPTS:
        r.delete(f"otp:{body.email}")
        raise HTTPException(status_code=429, detail="시도 횟수를 초과했습니다. 코드를 다시 받아주세요.")
    stored = r.get(f"otp:{body.email}")
    if not stored or not hmac.compare_digest(stored.encode(), body.otp.strip().encode()):
        raise HTTPException(status_code=400, detail="인증 코드가 올바르지 않습니다.")
    r.delete(f"otp_attempts:{body.email}")
    r.delete(f"otp:{body.email}")
    token = secrets.token_urlsafe(32)
    r.setex(f"contact_token:{token}", TOKEN_TTL, body.email)
    return {"verified_token": token}

@router.post("")
def submit_contact(form: ContactForm, db: Session = Depends(get_db)):
    r = get_redis()
    if not r:
        raise HTTPException(status_code=503, detail="Redis unavailable")
    verified_email = r.get(f"contact_token:{form.verified_token}")
    if not verified_email or verified_email != form.email:
        raise HTTPException(status_code=403, detail="이메일 인증이 필요합니다.")
    r.delete(f"contact_token:{form.verified_token}")
    msg = ContactMessage(name=form.name, email=form.email, message=form.message)
    db.add(msg)
    db.commit()
    try:
        send_contact_email(form)
    except Exception:
        pass
    return {"ok": True}

@router.get("/messages", response_model=list[ContactMessageOut])
def list_messages(db: Session = Depends(get_db), _=Depends(require_auth)):
    return db.query(ContactMessage).order_by(ContactMessage.created_at.desc()).all()

@router.patch("/messages/{message_id}/read")
def mark_read(message_id: int, db: Session = Depends(get_db), _=Depends(require_auth)):
    msg = db.get(ContactMessage, message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Not found")
    msg.is_read = True
    db.commit()
    return {"ok": True}

@router.delete("/messages/{message_id}")
def delete_message(message_id: int, db: Session = Depends(get_db), _=Depends(require_auth)):
    msg = db.get(ContactMessage, message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(msg)
    db.commit()
    return {"ok": True}
