from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth.utils import require_auth
from .models import Organization
from .schemas import OrgOut, OrgCreate

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.get("", response_model=list[OrgOut])
def list_orgs(db: Session = Depends(get_db)):
    return db.query(Organization).order_by(Organization.order, Organization.id).all()


@router.post("", response_model=OrgOut, dependencies=[Depends(require_auth)])
def create_org(data: OrgCreate, db: Session = Depends(get_db)):
    org = Organization(**data.model_dump())
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


@router.put("/{org_id}", response_model=OrgOut, dependencies=[Depends(require_auth)])
def update_org(org_id: int, data: OrgCreate, db: Session = Depends(get_db)):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in data.model_dump().items():
        setattr(org, k, v)
    db.commit()
    db.refresh(org)
    return org


@router.delete("/{org_id}", dependencies=[Depends(require_auth)])
def delete_org(org_id: int, db: Session = Depends(get_db)):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(org)
    db.commit()
    return {"ok": True}
