# imjemin's Homepage

**🌐 https://portfolio.imjemin.co.kr**

임제민의 개인 홈페이지 + 포트폴리오 사이트입니다.

## 기술 스택

| 영역 | 기술 |
|---|---|
| Frontend | React (TSX) + Vite + Tailwind CSS v4 |
| Backend | FastAPI + SQLAlchemy |
| DB | MariaDB 11 |
| Cache | Redis 7 (방문자 통계) |
| Infra | Docker + nginx + cloudflared |

## 구조

```
MY_HOMEPAGE/
├── frontend/
│   └── src/
│       ├── pages/        # Home, Projects, Contact, Admin
│       ├── components/   # Navbar, Footer, ProjectCard, ImageUpload
│       ├── api/          # axios 클라이언트
│       └── types/        # TypeScript 타입
└── backend/
    └── app/
        ├── auth/         # JWT 로그인
        ├── projects/     # 프로젝트 CRUD
        ├── contact/      # 문의 폼 + 메시지 관리
        ├── stats/        # 방문자 통계
        ├── uploads/      # 이미지 업로드
        └── profile/      # 내 정보 관리
```

## 기능

- **홈** — 프로필, 주요 프로젝트, 기술 스택
- **프로젝트** — 전체 프로젝트 카드 목록
- **연락하기** — 문의 폼
- **관리자** (`/admin`) — 내 정보·프로젝트·문의 메시지 관리
