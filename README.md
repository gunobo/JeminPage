# imjemin.co.kr

**🌐 https://imjemin.co.kr**

임제민의 개인 포트폴리오 사이트입니다. Raspberry Pi 위에서 Docker + Cloudflare Tunnel로 운영됩니다.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React (TSX) + Vite + Tailwind CSS v4 |
| Backend | FastAPI + SQLAlchemy ORM |
| Database | MariaDB 11 |
| Cache | Redis 7 (방문자 통계) |
| Infra | Docker Compose + nginx + Cloudflare Tunnel |
| Email | Cloudflare Email Routing + Gmail SMTP |

---

## 프로젝트 구조

```
MY_HOMEPAGE/
├── frontend/
│   ├── public/
│   │   ├── favicon.svg       # 로고
│   │   ├── og-image.png      # SNS 공유 이미지 (1200×630)
│   │   └── cv.pdf            # 이력서 (다운로드 버튼 연결)
│   └── src/
│       ├── pages/
│       │   ├── Home.tsx          # 메인 페이지
│       │   ├── Projects.tsx      # 프로젝트 목록
│       │   ├── ProjectDetail.tsx # 프로젝트 상세
│       │   ├── Blog.tsx          # 블로그/TIL 목록
│       │   ├── BlogPost.tsx      # 블로그 포스트
│       │   ├── Contact.tsx       # 문의 폼
│       │   └── Admin.tsx         # 관리자 대시보드
│       ├── components/
│       │   ├── layout/           # Navbar, Footer
│       │   └── ui/               # ImageUpload, Splash
│       ├── context/
│       │   └── LanguageContext.tsx  # 한/영 다국어
│       ├── hooks/
│       │   └── useScrollAnimation.ts
│       ├── api/                  # axios API 클라이언트
│       └── types/                # TypeScript 타입 정의
└── backend/
    └── app/
        ├── auth/         # JWT 로그인
        ├── projects/     # 프로젝트 CRUD
        ├── blog/         # 블로그 포스트 CRUD
        ├── contact/      # 문의 폼 + 메시지 관리
        ├── stats/        # 방문자 통계 (Redis)
        ├── uploads/      # 이미지 업로드
        └── profile/      # 프로필 관리
```

---

## 기능

### 공개 페이지
- **홈** — 프로필, 주요 프로젝트, 기술 스택, 스크롤 애니메이션, 방문자 카운터
- **Projects** — 전체 프로젝트 목록 + 상세 페이지
- **Blog** — 개발 경험 및 TIL 포스트 (마크다운 스타일)
- **Contact** — 문의 폼 (메일 자동 발송)
- **CV 다운로드** — `/public/cv.pdf`로 이력서 제공

### 관리자 (`/admin`)
- 비밀번호 로그인 (JWT)
- 프로필 편집 (이름, 소개, 기술 스택, 아바타)
- 프로젝트 추가/수정/삭제, 썸네일 업로드
- 블로그 포스트 작성/수정/삭제, 발행 토글
- 문의 메시지 확인/삭제

### 기타
- 한/영 다국어 토글
- 첫 방문 스플래시 애니메이션
- OG 태그 (SNS 공유 미리보기)
- Google Analytics 연동 준비 (`index.html` 주석 참고)

---

## 로컬 개발

```bash
# 의존성 설치
cd frontend && npm install

# 프론트엔드 개발 서버
npm run dev

# 백엔드 (Docker)
docker compose up db redis backend
```

환경변수 파일이 필요합니다:
- `.env` — MySQL 계정 정보
- `backend/.env` — DB URL, Redis URL, JWT Secret, SMTP 설정

---

## 배포 (Raspberry Pi)

```bash
git pull
./deploy.sh
```

`deploy.sh`는 `docker compose build && docker compose up -d`를 실행합니다.

Cloudflare Tunnel(`b67759dc`)이 `imjemin.co.kr → localhost:5100`으로 라우팅합니다.

---

## 이메일

- **수신** — Cloudflare Email Routing → `portfolio@imjemin.co.kr` → Gmail 전달
- **발신** — Gmail SMTP (`smtp.gmail.com:587`) + 앱 비밀번호, From 헤더는 `portfolio@imjemin.co.kr`
