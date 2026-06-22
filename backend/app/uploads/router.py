import uuid
import os
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from ..auth.utils import require_auth

UPLOAD_DIR = "/app/static/uploads"
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_TYPES = ALLOWED_IMAGE_TYPES | {"application/pdf"}
MAX_SIZE = 10 * 1024 * 1024  # 10MB

router = APIRouter(prefix="/uploads", tags=["uploads"])

@router.post("")
async def upload_file(file: UploadFile = File(...), _=Depends(require_auth)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="jpg/png/webp/gif/pdf만 업로드 가능합니다")

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="파일 크기는 10MB 이하여야 합니다")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "bin"
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    with open(filepath, "wb") as f:
        f.write(content)

    return {"url": f"/static/uploads/{filename}"}
