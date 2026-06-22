from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth.utils import require_auth
from .models import Certification
from .schemas import CertOut, CertCreate

router = APIRouter(prefix="/certifications", tags=["certifications"])


@router.get("", response_model=list[CertOut])
def list_certs(db: Session = Depends(get_db)):
    return db.query(Certification).order_by(Certification.acquired_date.desc(), Certification.order, Certification.id).all()


@router.post("", response_model=CertOut, dependencies=[Depends(require_auth)])
def create_cert(data: CertCreate, db: Session = Depends(get_db)):
    cert = Certification(**data.model_dump())
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return cert


@router.put("/{cert_id}", response_model=CertOut, dependencies=[Depends(require_auth)])
def update_cert(cert_id: int, data: CertCreate, db: Session = Depends(get_db)):
    cert = db.query(Certification).filter(Certification.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in data.model_dump().items():
        setattr(cert, k, v)
    db.commit()
    db.refresh(cert)
    return cert


@router.delete("/{cert_id}", dependencies=[Depends(require_auth)])
def delete_cert(cert_id: int, db: Session = Depends(get_db)):
    cert = db.query(Certification).filter(Certification.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(cert)
    db.commit()
    return {"ok": True}
