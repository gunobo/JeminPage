import uuid
import os
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from ..auth.utils import require_auth
from ..config import settings

UPLOAD_DIR = os.path.join(settings.STATIC_DIR, "uploads")
# 확장자는 파일명이 아니라 검증된 Content-Type에서 정한다 (.html/.svg 업로드로 인한 stored XSS 방지)
EXT_BY_TYPE = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "application/pdf": "pdf"}
MAGIC = {
    "image/jpeg": (b"\xff\xd8\xff",),
    "image/png": (b"\x89PNG\r\n\x1a\n",),
    "image/gif": (b"GIF87a", b"GIF89a"),
    "image/webp": (b"RIFF",),
    "application/pdf": (b"%PDF-",),
}
ALLOWED_TYPES = set(EXT_BY_TYPE)
MAX_SIZE = 10 * 1024 * 1024  # 10MB

router = APIRouter(prefix="/uploads", tags=["uploads"])

@router.post("")
async def upload_file(file: UploadFile = File(...), _=Depends(require_auth)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="jpg/png/webp/gif/pdf만 업로드 가능합니다")

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="파일 크기는 10MB 이하여야 합니다")

    if not content.startswith(MAGIC[file.content_type]):
        raise HTTPException(status_code=400, detail="파일 내용이 형식과 일치하지 않습니다")

    ext = EXT_BY_TYPE[file.content_type]
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    with open(filepath, "wb") as f:
        f.write(content)

    return {"url": f"/static/uploads/{filename}"}
