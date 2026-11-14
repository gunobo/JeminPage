from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth.utils import require_auth
from ..projects.models import Project
from .models import Award
from .schemas import AwardCreate, AwardOut

router = APIRouter(prefix="/awards", tags=["awards"])


def ordered(query):
    return query.order_by(
        Award.sort_order.is_(None), Award.sort_order.asc(),
        Award.awarded_date.is_(None), Award.awarded_date.desc(), Award.id.desc(),
    )


def _check_project(db: Session, project_id: int | None) -> None:
    if project_id is not None and not db.get(Project, project_id):
        raise HTTPException(status_code=400, detail="연결할 프로젝트가 없습니다")


@router.get("", response_model=list[AwardOut])
def list_awards(db: Session = Depends(get_db)):
    return ordered(db.query(Award)).all()


@router.post("", response_model=AwardOut, dependencies=[Depends(require_auth)])
def create_award(data: AwardCreate, db: Session = Depends(get_db)):
    _check_project(db, data.project_id)
    award = Award(**data.model_dump())
    db.add(award)
    db.commit()
    db.refresh(award)
    return award


@router.put("/{award_id}", response_model=AwardOut, dependencies=[Depends(require_auth)])
def update_award(award_id: int, data: AwardCreate, db: Session = Depends(get_db)):
    award = db.get(Award, award_id)
    if not award:
        raise HTTPException(status_code=404, detail="Not found")
    _check_project(db, data.project_id)
    for k, v in data.model_dump().items():
        setattr(award, k, v)
    db.commit()
    db.refresh(award)
    return award


@router.delete("/{award_id}", dependencies=[Depends(require_auth)])
def delete_award(award_id: int, db: Session = Depends(get_db)):
    award = db.get(Award, award_id)
    if not award:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(award)
    db.commit()
    return {"ok": True}
