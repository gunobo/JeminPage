import random
import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth.utils import require_auth
from ..stats.service import get_redis
from .models import ContactMessage
from .schemas import ContactForm, ContactMessageOut, OTPRequest, OTPVerify
from .service import send_otp_email, send_contact_email

router = APIRouter(prefix="/contact", tags=["contact"])

OTP_TTL = 300       # OTP 유효 5분
TOKEN_TTL = 1800    # 인증 토큰 유효 30분

@router.post("/otp/send")
def send_otp(body: OTPRequest):
    r = get_redis()
    if not r:
        raise HTTPException(status_code=503, detail="Redis unavailable")
    otp = str(random.randint(100000, 999999))
    r.setex(f"otp:{body.email}", OTP_TTL, otp)
    try:
        send_otp_email(body.email, otp)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"이메일 발송 실패: {e}")
    return {"ok": True}

@router.post("/otp/verify")
def verify_otp(body: OTPVerify):
    r = get_redis()
    if not r:
        raise HTTPException(status_code=503, detail="Redis unavailable")
    stored = r.get(f"otp:{body.email}")
    if not stored or stored != body.otp:
        raise HTTPException(status_code=400, detail="인증 코드가 올바르지 않습니다.")
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
