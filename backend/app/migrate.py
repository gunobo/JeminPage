"""컨테이너 시작 시 실행: `python -m app.migrate`

- alembic_version 테이블이 없고 projects 테이블이 이미 있으면
  → create_all() 시절의 운영 DB이므로 baseline으로 stamp만 한다.
- 그다음 `alembic upgrade head`.
"""
import os
import time

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect
from sqlalchemy.exc import OperationalError

from .config import settings

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASELINE = "0001_baseline"


def main() -> None:
    cfg = Config(os.path.join(BASE_DIR, "alembic.ini"))
    cfg.set_main_option("script_location", os.path.join(BASE_DIR, "migrations"))

    engine = create_engine(settings.DATABASE_URL)
    for attempt in range(30):
        try:
            with engine.connect() as conn:
                tables = set(inspect(conn).get_table_names())
            break
        except OperationalError:
            if attempt == 29:
                raise
            time.sleep(2)
    engine.dispose()

    if "alembic_version" not in tables and "projects" in tables:
        print(f"[migrate] 기존 DB 감지 → {BASELINE} 으로 stamp")
        command.stamp(cfg, BASELINE)

    command.upgrade(cfg, "head")
    print("[migrate] upgrade head 완료")


if __name__ == "__main__":
    main()
