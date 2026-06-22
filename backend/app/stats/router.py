from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth import verify_token
from .service import get_stats, record_visit, reset_stats, get_daily_stats

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("")
def visitor_stats(db: Session = Depends(get_db)):
    return get_stats(db)


@router.post("/visit")
def visit(db: Session = Depends(get_db)):
    try:
        record_visit(db)
    except Exception:
        pass
    return {"ok": True}


@router.get("/daily", dependencies=[Depends(verify_token)])
def daily_stats(days: int = 30, db: Session = Depends(get_db)):
    return get_daily_stats(db, days)


@router.delete("", dependencies=[Depends(verify_token)])
def reset(db: Session = Depends(get_db)):
    reset_stats(db)
    return {"ok": True}
