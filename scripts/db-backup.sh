#!/usr/bin/env bash
#
# Database backup + recovery procedure for GameBattles (Supabase / Postgres).
#
# Prerequisites:
#   - PostgreSQL client tools (pg_dump, psql) installed.
#   - A database connection string with read access to all schemas.
#
# Usage:
#   export DATABASE_URL="postgresql://user:pass@host:5432/postgres"
#   ./scripts/db-backup.sh            # writes backups/db-<timestamp>.sql.gz
#
# Restore (recovery):
#   gunzip -c backups/db-<timestamp>.sql.gz | psql "$DATABASE_URL"
#
# For automated daily backups, schedule this script via the host's scheduler
# (cron on Linux, Task Scheduler on Windows) and ship the backups/ directory to
# off-host object storage (e.g. S3, Cloudflare R2, Supabase Storage).

set -euo pipefail

: "${DATABASE_URL:?Set DATABASE_URL to your Postgres connection string first.}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/../backups}"
mkdir -p "$BACKUP_DIR"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$BACKUP_DIR/db-$STAMP.sql.gz"

echo "Dumping database to $OUT ..."
pg_dump --no-owner --no-privileges --clean --if-exists "$DATABASE_URL" | gzip > "$OUT"

echo "Backup complete: $OUT"
echo "To restore: gunzip -c \"$OUT\" | psql \"\$DATABASE_URL\""

# Retention: keep the 14 most recent backups.
ls -1t "$BACKUP_DIR"/db-*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm -f