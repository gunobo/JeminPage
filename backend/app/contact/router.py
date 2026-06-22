from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth.utils import require_auth
from .models import ContactMessage
from .schemas import ContactForm, ContactMessageOut
from .service import send_email

router = APIRouter(prefix="/contact", tags=["contact"])

@router.post("")
def submit_contact(form: ContactForm, db: Session = Depends(get_db)):
    msg = ContactMessage(**form.model_dump())
    db.add(msg)
    db.commit()
    try:
        send_email(form)
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
