#!/bin/bash
# 관리자 비상 비밀번호 로그인 켜기/끄기
#
#   ./emergency-login.sh on      # 켜기 (Google 로그인이 안 될 때만)
#   ./emergency-login.sh off     # 끄기 (평소 상태)
#   ./emergency-login.sh status  # 현재 상태 확인
#
# 비밀번호는 backend/.env 의 ADMIN_PASSWORD 를 쓴다 (이 파일에는 넣지 않는다).
# 켜 두면 /admin 로그인 화면에 "비상 로그인" 메뉴가 나타난다. 쓰고 나면 반드시 off.
set -euo pipefail

cd "$(dirname "$0")"
ENV_FILE=backend/.env

[ -f "$ENV_FILE" ] || { echo "✗ $ENV_FILE 이 없습니다"; exit 1; }

current() {
  grep -E "^ALLOW_PASSWORD_LOGIN=" "$ENV_FILE" | cut -d= -f2 || true
}

status() {
  local flag api
  flag=$(current)
  api=$(curl -s -m 5 -H "X-Requested-From: imjemin-frontend" http://localhost:5100/api/auth/config || true)
  echo ".env 설정 : ALLOW_PASSWORD_LOGIN=${flag:-없음}"
  echo "실행 중   : ${api:-백엔드 응답 없음}"
}

set_flag() {
  local value=$1
  if grep -qE "^ALLOW_PASSWORD_LOGIN=" "$ENV_FILE"; then
    sed -i "s/^ALLOW_PASSWORD_LOGIN=.*/ALLOW_PASSWORD_LOGIN=$value/" "$ENV_FILE"
  else
    printf "\nALLOW_PASSWORD_LOGIN=%s\n" "$value" >> "$ENV_FILE"
  fi
  if [ "$value" = true ] && ! grep -qE "^ADMIN_PASSWORD=.+" "$ENV_FILE"; then
    echo "⚠ ADMIN_PASSWORD 가 비어 있어서 켜도 비상 로그인이 동작하지 않습니다 ($ENV_FILE 에 설정하세요)"
  fi
  # env_file 변경은 컨테이너를 다시 만들어야 반영된다
  docker compose up -d --no-deps --force-recreate backend
  echo "백엔드 재시작 대기 중..."
  for _ in $(seq 1 30); do
    curl -s -m 2 -o /dev/null -H "X-Requested-From: imjemin-frontend" http://localhost:5100/api/health && break
    sleep 1
  done
  status
}

case "${1:-status}" in
  on)
    set_flag true
    echo
    echo "✓ 비상 로그인 켜짐 — /admin 의 '비상 로그인' 메뉴에서 ADMIN_PASSWORD 로 로그인하세요."
    echo "  다 쓰면 꼭 ./emergency-login.sh off"
    ;;
  off)
    set_flag false
    echo
    echo "✓ 비상 로그인 꺼짐 — Google 로그인만 가능합니다."
    echo "  (켜져 있던 동안 발급된 로그인 토큰은 최대 12시간 유효)"
    ;;
  status)
    status
    ;;
  *)
    echo "사용법: $0 on|off|status"
    exit 1
    ;;
esac
