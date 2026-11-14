import io
import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from starlette.concurrency import run_in_threadpool

from ..auth.utils import require_auth
from ..config import settings

UPLOAD_DIR = os.path.join(settings.STATIC_DIR, "uploads")
MAX_SIZE = 25 * 1024 * 1024  # 25MB — 폰 원본 사진(PNG/HEIC)까지 받는다. nginx client_max_body_size와 맞출 것
# 이보다 크면 서버에서 줄여서 저장 (웹에 쓰기엔 충분한 크기)
MAX_SIDE = 2560
SHRINK_OVER = 3 * 1024 * 1024

router = APIRouter(prefix="/uploads", tags=["uploads"])


def detect(content: bytes) -> str | None:
    """파일 앞부분(매직 바이트)으로 실제 형식을 판별한다.

    브라우저가 보내는 Content-Type이나 파일 확장자는 믿지 않는다
    (예: 이름은 .jpg인데 내용은 PNG, 또는 이미지로 위장한 HTML).
    """
    if content.startswith(b"\xff\xd8\xff"):
        return "jpg"
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if content[:6] in (b"GIF87a", b"GIF89a"):
        return "gif"
    if content[:4] == b"RIFF" and content[8:12] == b"WEBP":
        return "webp"
    if content.startswith(b"%PDF-"):
        return "pdf"
    # HEIC/HEIF (아이폰 사진): ....ftypheic / heix / mif1 / msf1 ...
    if content[4:8] == b"ftyp" and content[8:12] in (b"heic", b"heix", b"hevc", b"heif", b"mif1", b"msf1"):
        return "heic"
    return None


def heic_to_jpeg(content: bytes) -> bytes:
    from PIL import Image, ImageOps
    from pillow_heif import register_heif_opener

    register_heif_opener()
    im = Image.open(io.BytesIO(content))
    im = ImageOps.exif_transpose(im).convert("RGB")  # 세로 사진 회전 정보 반영
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=92, optimize=True)
    return buf.getvalue()


def shrink_image(content: bytes, kind: str) -> tuple[bytes, str]:
    """큰 사진을 긴 변 MAX_SIDE 이하로 줄이고 다시 압축한다.
    투명 배경이 있으면 PNG, 없으면 JPEG(품질 90). 이미 작으면 그대로 둔다."""
    from PIL import Image, ImageOps

    im = Image.open(io.BytesIO(content))
    if len(content) <= SHRINK_OVER and max(im.size) <= MAX_SIDE:
        return content, kind
    im = ImageOps.exif_transpose(im)
    im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
    has_alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
    buf = io.BytesIO()
    if has_alpha:
        im.convert("RGBA").save(buf, "PNG", optimize=True)
        return buf.getvalue(), "png"
    im.convert("RGB").save(buf, "JPEG", quality=90, optimize=True)
    return buf.getvalue(), "jpg"


@router.post("")
async def upload_file(file: UploadFile = File(...), _=Depends(require_auth)):
    content = await file.read(MAX_SIZE + 1)
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="파일 크기는 25MB 이하여야 합니다")
    if not content:
        raise HTTPException(status_code=400, detail="빈 파일입니다")

    kind = detect(content)
    if kind is None:
        raise HTTPException(status_code=400, detail="jpg·png·webp·gif·heic 이미지 또는 pdf만 올릴 수 있습니다")

    if kind == "heic":
        try:
            content = await run_in_threadpool(heic_to_jpeg, content)
        except Exception:
            raise HTTPException(status_code=400, detail="HEIC 사진을 변환하지 못했습니다. JPG로 바꿔서 올려주세요")
        kind = "jpg"

    if kind in ("jpg", "png", "webp"):
        try:
            content, kind = await run_in_threadpool(shrink_image, content, kind)
        except Exception:
            raise HTTPException(status_code=400, detail="이미지를 읽을 수 없습니다. 파일이 손상됐는지 확인해주세요")

    # 확장자는 판별된 형식에서 정한다 → .html/.svg 등은 저장될 수 없다
    filename = f"{uuid.uuid4().hex}.{kind}"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    with open(os.path.join(UPLOAD_DIR, filename), "wb") as f:
        f.write(content)

    return {"url": f"/static/uploads/{filename}"}
