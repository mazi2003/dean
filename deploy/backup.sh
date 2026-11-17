#!/usr/bin/env bash
# PostgreSQL backup script for Digital Dean's Office
# Example cron (daily at 03:30):
#   30 3 * * * /opt/dean-office/deploy/backup.sh >> /var/log/dean-backup.log 2>&1
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/dean-office}"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUT_FILE="$BACKUP_DIR/dean_${TIMESTAMP}.sql.gz"

cd "$APP_DIR"
docker compose exec -T db pg_dump -U dean dean | gzip > "$OUT_FILE"

# Keep last 14 days
find "$BACKUP_DIR" -name "dean_*.sql.gz" -mtime +14 -delete
echo "Backup saved to $OUT_FILE"
