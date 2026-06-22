from fastapi import APIRouter
from .service import get_stats, record_visit

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("")
def visitor_stats():
    return get_stats()

@router.post("/visit")
def visit():
    try:
        record_visit()
    except Exception:
        pass
    return {"ok": True}
