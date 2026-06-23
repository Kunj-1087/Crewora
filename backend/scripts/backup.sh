#!/bin/bash
# ============================================================
# CREWORA — Automated Database Backup Script
# ============================================================
# Runs via cron daily at 2 AM IST (20:30 UTC previous day)
#
# Features:
# - pg_dump with compression
# - 30-day retention
# - Backup verification (restore to temp DB)
# - Alert on failure
#
# Cron entry (2 AM IST = 20:30 UTC):
#   30 20 * * * /path/to/crewora-backend/scripts/backup.sh
# ============================================================

set -euo pipefail

# ─── Configuration ────────────────────────────────────────────────────────────

# Database
DATABASE_URL="${DATABASE_URL:-postgresql://crewora_user:password@localhost:5432/crewora}"

# Backup storage
BACKUP_DIR="${BACKUP_DIR:-/backups/crewora}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# S3 storage (optional — set these to use S3 backup)
S3_BUCKET="${S3_BUCKET:-}"
S3_PREFIX="${S3_PREFIX:-backups/crewora}"
AWS_PROFILE="${AWS_PROFILE:-default}"

# Sentry DSN for alerting (optional)
SENTRY_DSN="${SENTRY_DSN:-}"

# Temp DB for verification
VERIFY_DB_NAME="crewora_backup_verify"

# Timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/crewora_${TIMESTAMP}.sql.gz"
BACKUP_LOG="${BACKUP_DIR}/backup_${TIMESTAMP}.log"

# ─── Functions ────────────────────────────────────────────────────────────────

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$BACKUP_LOG"
}

alert() {
    local message="$1"
    log "ALERT: $message"

    # Send to Sentry if configured
    if [ -n "$SENTRY_DSN" ]; then
        curl -s -X POST "$SENTRY_DSN" \
            -H "Content-Type: application/json" \
            -d "{\"message\": \"$message\", \"level\": \"error\", \"logger\": \"backup-script\"}" \
            > /dev/null 2>&1 || true
    fi

    # Send email alert if configured
    if [ -n "${ALERT_EMAIL:-}" ]; then
        echo "$message" | mail -s "CREWORA BACKUP ALERT" "$ALERT_EMAIL" || true
    fi
}

cleanup() {
    log "Cleaning up..."
    dropdb --if-exists "$VERIFY_DB_NAME" 2>/dev/null || true
}

# ─── Main ─────────────────────────────────────────────────────────────────────

trap cleanup EXIT

# Create backup directory
mkdir -p "$BACKUP_DIR"

log "Starting Crewora database backup..."

# Step 1: Run pg_dump
log "Running pg_dump..."
if pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "Backup created: $BACKUP_FILE ($BACKUP_SIZE)"
else
    alert "Backup FAILED: pg_dump returned non-zero exit code"
    exit 1
fi

# Step 2: Verify backup (restore to temp DB and run sanity check)
log "Verifying backup integrity..."
if createdb "$VERIFY_DB_NAME" 2>/dev/null; then
    if gunzip -c "$BACKUP_FILE" | psql -d "$VERIFY_DB_NAME" > /dev/null 2>&1; then
        # Run sanity check queries
        CUSTOMER_COUNT=$(psql -d "$VERIFY_DB_NAME" -t -A -c "SELECT COUNT(*) FROM \"Customer\" WHERE \"deleted_at\" IS NULL;" 2>/dev/null || echo "0")
        WORKER_COUNT=$(psql -d "$VERIFY_DB_NAME" -t -A -c "SELECT COUNT(*) FROM \"Worker\" WHERE \"deleted_at\" IS NULL;" 2>/dev/null || echo "0")
        JOB_COUNT=$(psql -d "$VERIFY_DB_NAME" -t -A -c "SELECT COUNT(*) FROM \"Job\" WHERE \"deleted_at\" IS NULL;" 2>/dev/null || echo "0")

        log "Backup verified: $CUSTOMER_COUNT customers, $WORKER_COUNT workers, $JOB_COUNT jobs"

        if [ "$CUSTOMER_COUNT" -eq 0 ] && [ "$WORKER_COUNT" -eq 0 ]; then
            alert "Backup verification WARNING: Zero records found in restored backup"
        fi
    else
        alert "Backup verification FAILED: Could not restore backup to temp database"
        rm -f "$BACKUP_FILE"
        exit 1
    fi
    dropdb "$VERIFY_DB_NAME" 2>/dev/null || true
else
    log "Skipping verification (temp DB creation failed — likely running outside Docker)"
fi

# Step 3: Upload to S3 (if configured)
if [ -n "$S3_BUCKET" ]; then
    log "Uploading to S3: s3://${S3_BUCKET}/${S3_PREFIX}/..."
    if aws s3 cp "$BACKUP_FILE" "s3://${S3_BUCKET}/${S3_PREFIX}/crewora_${TIMESTAMP}.sql.gz" \
        --profile "$AWS_PROFILE" 2>&1; then
        log "S3 upload complete"
    else
        alert "S3 upload FAILED"
    fi
fi

# Step 4: Clean up old backups (local)
log "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "crewora_*.sql.gz" -type f -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -name "backup_*.log" -type f -mtime "+$RETENTION_DAYS" -delete

log "Backup complete: $BACKUP_FILE"
exit 0
