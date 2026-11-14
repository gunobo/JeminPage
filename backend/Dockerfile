FROM python:3.12-slim

WORKDIR /app

# - gcc/libffi/libssl: ARM에서 cryptography 소스 빌드 방지
# - pango/harfbuzz: WeasyPrint(PDF) 런타임
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libffi-dev libssl-dev \
    libpango-1.0-0 libpangoft2-1.0-0 libharfbuzz0b libharfbuzz-subset0 fontconfig \
    curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# PDF 한글 폰트 (없으면 한글이 깨진다) — Pretendard, SIL OFL
ARG PRETENDARD_VERSION=1.3.9
RUN mkdir -p /app/fonts && for w in Regular SemiBold ExtraBold; do \
      curl -fsSL -o /app/fonts/Pretendard-$w.otf \
        "https://cdn.jsdelivr.net/npm/pretendard@${PRETENDARD_VERSION}/dist/public/static/Pretendard-$w.otf"; \
    done \
    && mkdir -p /usr/local/share/fonts && cp /app/fonts/*.otf /usr/local/share/fonts/ && fc-cache -f

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# 마이그레이션 → 서버 시작
CMD ["sh", "-c", "python -m app.migrate && exec uvicorn app.main:app --host 0.0.0.0 --port 8000"]
