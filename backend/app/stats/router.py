from fastapi import APIRouter
from .service import get_stats

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("")
def visitor_stats():
    return get_stats()
