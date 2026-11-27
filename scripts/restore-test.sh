#!/usr/bin/env bash
#
# Automated restore test: restores the most recent backup into a throwaway
# database, runs a sanity query, then drops it. Proves backups are restorable.
#
# Requirements: pg_dump/psql/createdb/dropdb client tools.
#
# Usage:
#   export DATABASE_URL="postgresql://user:pass@host:5432/postgres"
#   export ADMIN_DATABASE_URL="postgresql://user:pass@host:5432/postgres"  # optional, to create/drop DB
#   ./scripts/restore-test.sh
#
set -euo pipefail

: "${DATABASE_URL:?Set DATABASE_URL first.}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/../backups}"
LATEST="$(ls -1t "$BACKUP_DIR"/db-*.sql.gz 2>/dev/null | head -n1 || true)"

if [ -z "$LATEST" ]; then
  echo "No backups found in $BACKUP_DIR. Run db-backup.sh first." >&2
  exit 1
fi

TEST_DB="gb_restore_test_$(date -u +%Y%m%d%H%M%S)"
ADMIN_URL="${ADMIN_DATABASE_URL:-$DATABASE_URL}"

cleanup() { dropdb "$ADMIN_URL" "$TEST_DB" >/dev/null 2>&1 || true; }
trap cleanup EXIT

echo "Creating test database $TEST_DB ..."
createdb "$ADMIN_URL" "$TEST_DB"

echo "Restoring $LATEST into $TEST_DB ..."
gunzip -c "$LATEST" | psql "$ADMIN_URL" "$TEST_DB" >/dev/null

echo "Running sanity query ..."
psql "$ADMIN_URL" "$TEST_DB" -c "select count(*) as profiles from public.profiles;" >/dev/null

echo "Restore test PASSED using $LATEST"