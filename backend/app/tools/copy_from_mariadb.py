"""MariaDB → PostgreSQL 1회성 데이터 이전.

    docker compose run --rm \\
      -e SOURCE_DATABASE_URL='mariadb+pymysql://USER:PASS@mariadb:3306/homepage' \\
      backend python -m app.tools.copy_from_mariadb

- 대상 DB = DATABASE_URL (PostgreSQL). 먼저 alembic으로 최신 스키마를 만든다.
- 대상 테이블이 하나라도 비어 있지 않으면 아무것도 하지 않고 중단한다 (두 번 실행해도 안전).
- 원본은 읽기만 한다. 원본에 없는 테이블/컬럼(예: 배포 전 MariaDB에는 awards가 없음)은 건너뛰고 기본값을 쓴다.
- 전체를 한 트랜잭션으로 복사하고, 테이블별 행 수가 원본과 다르면 롤백한다.
"""
import json
import os
import sys

from sqlalchemy import JSON, Boolean, MetaData, create_engine, func, inspect, select, text

from .. import models_registry  # noqa: F401
from ..config import settings
from ..database import Base

SKIP = {"alembic_version"}


def _coerce(col, value):
    if value is None:
        return None
    # MariaDB BOOLEAN = TINYINT(1) → 0/1
    if isinstance(col.type, Boolean):
        return bool(value)
    # MariaDB JSON = LONGTEXT → 문자열로 읽힌다
    if isinstance(col.type, JSON) and isinstance(value, (str, bytes)):
        return json.loads(value)
    return value


def main() -> int:
    src_url = os.environ.get("SOURCE_DATABASE_URL")
    if not src_url:
        print("SOURCE_DATABASE_URL 환경변수가 필요합니다", file=sys.stderr)
        return 2
    if not settings.DATABASE_URL.startswith("postgresql"):
        print(f"대상 DATABASE_URL이 PostgreSQL이 아닙니다: {settings.DATABASE_URL.split('@')[-1]}", file=sys.stderr)
        return 2

    # 1) 대상 스키마 생성
    from ..migrate import main as migrate
    migrate()

    src = create_engine(src_url)
    dst = create_engine(settings.DATABASE_URL)

    src_meta = MetaData()
    src_meta.reflect(bind=src)
    src_tables = {t.name: t for t in src_meta.sorted_tables}

    tables = [t for t in Base.metadata.sorted_tables if t.name not in SKIP]  # FK 순서 (projects → awards)

    # 2) 대상이 비어 있는지 확인
    with dst.connect() as c:
        filled = [t.name for t in tables if c.execute(select(func.count()).select_from(t)).scalar()]
    if filled:
        print(f"[copy] 중단: 대상 DB에 이미 데이터가 있습니다 → {filled}", file=sys.stderr)
        return 1

    report = []
    with src.connect() as s, dst.begin() as d:
        # MariaDB DATETIME은 시간대 없는 UTC 값 → timestamptz로 넣을 때 UTC로 해석되게 고정
        d.execute(text("SET LOCAL TIME ZONE 'UTC'"))
        for t in tables:
            st = src_tables.get(t.name)
            if st is None:
                report.append((t.name, "-", 0, "원본에 없음 (건너뜀)"))
                continue
            cols = [c for c in t.columns if c.name in st.columns]
            rows = s.execute(select(*[st.columns[c.name] for c in cols])).all()
            if rows:
                d.execute(t.insert(), [{c.name: _coerce(c, v) for c, v in zip(cols, row)} for row in rows])
            missing = sorted(set(t.columns.keys()) - set(st.columns.keys()))
            report.append((t.name, len(rows), None, f"원본에 없는 컬럼 기본값 사용: {missing}" if missing else ""))

        # 배포 전 MariaDB(0002 이전)에서 왔다면 0002의 데이터 보정도 적용
        if "profile" in src_tables and "cv_mode" not in src_tables["profile"].columns:
            d.execute(text("UPDATE profile SET cv_mode = 'upload' WHERE cv_url IS NOT NULL AND cv_url <> ''"))

        # 3) SERIAL 시퀀스를 MAX(id)+1 로
        for t in tables:
            if "id" in t.columns:
                d.execute(text(
                    f"SELECT setval(pg_get_serial_sequence('{t.name}', 'id'), "
                    f"COALESCE((SELECT MAX(id) FROM {t.name}), 0) + 1, false)"
                ))

        # 4) 행 수 검증 — 다르면 예외 → 전체 롤백
        final = []
        for name, n_src, _, note in report:
            n_dst = d.execute(text(f"SELECT COUNT(*) FROM {name}")).scalar()
            if n_src != "-" and n_dst != n_src:
                raise RuntimeError(f"{name}: 원본 {n_src}행, 대상 {n_dst}행 — 롤백합니다")
            final.append((name, n_src, n_dst, note))

    print("[copy] 완료")
    for name, n_src, n_dst, note in final:
        print(f"  {name:<18} 원본 {str(n_src):>5}  →  대상 {n_dst:>5}  {note}")
    extra = sorted(set(inspect(src).get_table_names()) - {t.name for t in tables} - SKIP)
    if extra:
        print(f"  (원본에만 있고 복사하지 않은 테이블: {extra})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
