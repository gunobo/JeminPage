from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from .utils import create_token
from ..config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    password: str

@router.post("/login")
def login(body: LoginRequest):
    if body.password != settings.ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid password")
    return {"access_token": create_token()}
