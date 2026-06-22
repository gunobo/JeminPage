#!/bin/bash
set -e

echo "=== [1/4] 최신 코드 받기 ==="
git pull origin main

echo "=== [2/4] 새 이미지 빌드 ==="
docker compose build --no-cache

echo "=== [3/4] DB/Redis는 유지하고 앱만 재시작 ==="
# DB와 Redis는 건드리지 않고 backend/frontend만 교체
docker compose up -d --no-deps backend frontend

echo "=== [4/4] 이전 이미지 정리 ==="
docker image prune -f

echo ""
echo "✓ 배포 완료"
docker compose ps
