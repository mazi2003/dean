#!/usr/bin/env bash
# Idempotent Ubuntu 22.04/24.04 VPS bootstrap for Digital Dean's Office
# Usage:
#   sudo bash deploy/bootstrap-vps.sh [--domain your-domain.ru] [--mirror]
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
DOMAIN_ARG=""
USE_MIRROR=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)
      DOMAIN_ARG="${2:-}"
      shift 2
      ;;
    --mirror)
      USE_MIRROR=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "==> [1/6] Installing base packages and Docker Engine..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq ca-certificates curl gnupg lsb-release openssl ufw

if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

if [[ "$USE_MIRROR" == "true" ]]; then
  echo "==> Configuring Docker registry mirrors (for Russian-accessible pulls)..."
  mkdir -p /etc/docker
  cat >/etc/docker/daemon.json <<'EOF'
{
  "registry-mirrors": [
    "https://mirror.gcr.io",
    "https://dockerhub.timeweb.cloud"
  ]
}
EOF
  systemctl restart docker
fi

systemctl enable --now docker

echo "==> [2/6] Configuring 2GB swap if RAM < 2GB..."
TOTAL_RAM_MB=$(free -m | awk '/^Mem:/ {print $2}')
if [[ "$TOTAL_RAM_MB" -lt 2048 ]] && [[ ! -f /swapfile ]]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> [3/6] Configuring UFW firewall (22, 80, 443)..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> [4/6] Preparing .env (never overwriting existing .env)..."
cd "$APP_DIR"
if [[ ! -f .env ]]; then
  PUBLIC_IP=$(curl -4 -fsS https://ifconfig.me || curl -4 -fsS https://api.ipify.org || hostname -I | awk '{print $1}')
  if [[ -n "$DOMAIN_ARG" ]]; then
    DOMAIN_VAL="$DOMAIN_ARG"
  else
    IP_DASHED="${PUBLIC_IP//./-}"
    DOMAIN_VAL="${IP_DASHED}.sslip.io"
  fi

  DB_PASS=$(openssl rand -hex 24)
  JWT_SEC=$(openssl rand -hex 32)
  COOKIE_SEC=$(openssl rand -hex 32)
  STUDENT_PASS="${SEED_STUDENT_PASSWORD:-DemoStudent123!}"
  STAFF_PASS="${SEED_STAFF_PASSWORD:-DemoStaff123!}"

  cat >.env <<EOF
DOMAIN=${DOMAIN_VAL}
DB_PASSWORD=${DB_PASS}
DATABASE_URL=postgresql://dean:${DB_PASS}@db:5432/dean?schema=public
JWT_SECRET=${JWT_SEC}
COOKIE_SECRET=${COOKIE_SEC}
COOKIE_SECURE=true
TRUST_PROXY=true
CORS_ORIGIN=https://${DOMAIN_VAL}
SEED_STUDENT_PASSWORD=${STUDENT_PASS}
SEED_STAFF_PASSWORD=${STAFF_PASS}

# Optional OpenAI-compatible AI assistant (server-side only)
AI_BASE_URL=${AI_BASE_URL:-}
AI_API_KEY=${AI_API_KEY:-}
AI_MODEL=${AI_MODEL:-}
EOF
  chmod 600 .env
  echo "Created .env for domain: https://${DOMAIN_VAL}"
else
  echo ".env already exists — preserving existing configuration."
fi

echo "==> [5/6] Building and starting Docker Compose stack..."
docker compose up -d --build

echo "==> [6/6] Waiting for healthcheck..."
sleep 8
bash "$APP_DIR/deploy/healthcheck.sh" || true

DOMAIN_FINAL=$(grep -E '^DOMAIN=' .env | cut -d= -f2-)
echo ""
echo "Deployment complete!"
echo "Public URL: https://${DOMAIN_FINAL}"
