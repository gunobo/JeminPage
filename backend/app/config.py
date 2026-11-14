from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str = "redis://redis:6379"
    SECRET_KEY: str
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    CONTACT_EMAIL: str = ""

    # ── Auth ──
    GOOGLE_CLIENT_ID: str = ""
    # 쉼표로 구분된 관리자 이메일 목록
    ADMIN_EMAILS: str = ""
    # 비상용 비밀번호 로그인. 평소엔 false
    ALLOW_PASSWORD_LOGIN: bool = False
    ADMIN_PASSWORD: str = ""
    JWT_EXPIRE_HOURS: int = 12

    # ── SEO / Export ──
    SITE_URL: str = "https://imjemin.co.kr"
    STATIC_DIR: str = "/app/static"

    @property
    def admin_emails(self) -> set[str]:
        return {e.strip().lower() for e in self.ADMIN_EMAILS.split(",") if e.strip()}

    class Config:
        env_file = ".env"


settings = Settings()
