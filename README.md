# imjemin.co.kr

**🌐 https://imjemin.co.kr**

임제민의 개인 포트폴리오 사이트. Raspberry Pi 위에서 Docker + Cloudflare Tunnel로 운영됩니다.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React (TSX) + Vite + Tailwind CSS v4 |
| Backend | FastAPI + SQLAlchemy ORM |
| Database | MariaDB 11 |
| Cache | Redis 7 |
| Infra | Docker Compose + nginx + Cloudflare Tunnel |
| Email | Cloudflare Email Routing + Gmail SMTP |

---

## 기능

### 공개 페이지
- **홈** — 프로필, 주요 프로젝트, 기술 스택, 동아리/조직 활동, 자격증, 연간 목표, 방문자 카운터
- **Projects** — 프로젝트 목록 + 상세 페이지
- **Blog** — 개발 기록 포스트 (마크다운 스타일)
- **Contact** — 문의 폼 (이메일 자동 발송)

### 관리자 (`/admin`)
- JWT 비밀번호 로그인
- 프로필 편집 — 이름, 소개, tagline, 아바타, CV, OG 이미지, 흘러가는 텍스트
- 프로젝트 — 추가/수정/삭제, 썸네일 업로드, 메인 노출 토글
- 활동 — 동아리/조직 기록 (이름, 소속 기관, 역할, 기간, 설명, 로고, 링크)
- 자격증 — 자격증명, 발급 기관, 취득일 관리
- 블로그 — 포스트 작성/수정/삭제, 발행 토글, 라이브 미리보기
- 메시지 — 문의 메시지 확인/삭제
- 방문자 통계 — 일별 차트 (7/30/90일), 초기화

### 기타
- 한/영 다국어 토글
- 첫 방문 스플래시 애니메이션
- OG 태그 동적 생성 (nginx SSI + profile DB)
- Discord 도메인 연동 (`/.well-known/discord`)
- `/api/` 직접 접근 차단 (nginx 커스텀 헤더 검증)

---

## 프로젝트 구조

```
MY_HOMEPAGE/
├── frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   ├── og-image.png          # SNS 공유 이미지 (1200×630)
│   │   └── .well-known/discord   # Discord 도메인 인증
│   └── src/
│       ├── pages/
│       │   ├── Home.tsx
│       │   ├── Projects.tsx
│       │   ├── ProjectDetail.tsx
│       │   ├── Blog.tsx
│       │   ├── BlogPost.tsx
│       │   ├── Contact.tsx
│       │   └── Admin.tsx
│       ├── components/
│       │   ├── layout/            # Navbar
│       │   └── ui/                # ImageUpload, FileUpload, Splash
│       ├── context/
│       │   └── LanguageContext.tsx
│       ├── api/                   # axios 클라이언트
│       └── types/
└── backend/
    └── app/
        ├── auth/                  # JWT 로그인
        ├── profile/               # 프로필 + OG 메타 엔드포인트
        ├── projects/              # 프로젝트 CRUD
        ├── organizations/         # 동아리/조직 활동 CRUD
        ├── certifications/        # 자격증 CRUD
        ├── blog/                  # 블로그 포스트 CRUD
        ├── contact/               # 문의 폼 + 메시지 관리
        ├── stats/                 # 방문자 통계 (DB + Redis)
        └── uploads/               # 이미지/파일 업로드
```

---

## 배포

```bash
git pull
./deploy.sh
```

Cloudflare Tunnel이 `imjemin.co.kr → localhost:5100`으로 라우팅합니다.

---

## 로컬 개발

```bash
cd frontend && npm install && npm run dev

# 백엔드
docker compose up db redis backend
```

환경변수:
- `.env` — DB 계정 정보
- `backend/.env` — DB URL, Redis URL, JWT Secret, SMTP 설정

---

## 이메일

- **수신** — Cloudflare Email Routing → `portfolio@imjemin.co.kr` → Gmail 전달
- **발신** — Gmail SMTP (`smtp.gmail.com:587`), From: `portfolio@imjemin.co.kr`
