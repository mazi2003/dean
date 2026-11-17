#!/usr/bin/env bash
# Post-deploy verification: health endpoint, real login, and 401 on wrong password
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"

DOMAIN=$(grep -E '^DOMAIN=' .env | cut -d= -f2- || echo "localhost")
STUDENT_PASS=$(grep -E '^SEED_STUDENT_PASSWORD=' .env | cut -d= -f2- || echo "DemoStudent123!")

if [[ "$DOMAIN" == "localhost" ]]; then
  BASE_URL="http://localhost"
else
  BASE_URL="https://${DOMAIN}"
fi

echo "==> Checking $BASE_URL/api/v1/health..."
curl -fsS "$BASE_URL/api/v1/health" | grep -q '"status":"ok"'
echo "   OK: /api/v1/health returned status=ok"

echo "==> Checking 401 on wrong password..."
STATUS_BAD=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"aigul.nurova@demo.edu","password":"WrongPassword123"}')
if [[ "$STATUS_BAD" != "401" ]]; then
  echo "   FAIL: expected 401, got $STATUS_BAD"
  exit 1
fi
echo "   OK: wrong password returned HTTP 401"

echo "==> Checking real login with demo student account..."
COOKIE_JAR=$(mktemp)
trap 'rm -f "$COOKIE_JAR"' EXIT
STATUS_OK=$(curl -s -c "$COOKIE_JAR" -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"aigul.nurova@demo.edu\",\"password\":\"${STUDENT_PASS}\"}")
if [[ "$STATUS_OK" != "200" ]]; then
  echo "   FAIL: expected 200, got $STATUS_OK"
  exit 1
fi

curl -fsS -b "$COOKIE_JAR" "$BASE_URL/api/v1/profile" | grep -q 'aigul.nurova@demo.edu'
echo "   OK: real cookie-authenticated session verified!"
