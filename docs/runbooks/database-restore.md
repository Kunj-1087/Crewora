# Database Restoration Runbook

> **Target audience:** CEO / non-technical operator in an emergency
> **Time to restore:** ~15-30 minutes
> **Prerequisites:** Access to the backup file + database credentials

---

## Quick Reference

| Item | Value |
|---|---|
| Backup frequency | Daily at 2:00 AM IST |
| Backup location | `/backups/crewora/` (server) + S3 |
| Retention period | 30 days |
| Database type | PostgreSQL 15 |
| Connection string | `DATABASE_URL` env variable |
| Point-in-time recovery | Enable in Supabase Dashboard (see §4) |

---

## Step 1: Identify Which Backup to Restore

**SSH into the server:**
```bash
ssh deploy@crewora-server
```

**List available backups:**
```bash
ls -la /backups/crewora/crewora_*.sql.gz
```

**Or check S3 (if configured):**
```bash
aws s3 ls s3://crewora-backups/backups/crewora/
```

**Choose the most recent backup before the incident occurred.** Backups are named:
```
crewora_20260115_020000.sql.gz  → Backup from Jan 15, 2026 at 2:00 AM
```

---

## Step 2: Stop the Application

**Stop the backend service to prevent writes during restore:**
```bash
# If using Docker:
docker stop crewora-backend

# If using systemd:
sudo systemctl stop crewora-backend

# If using PM2:
pm2 stop crewora-backend
```

**Verify the app is stopped:**
```bash
curl http://localhost:5000/api/health
# Should return "connection refused" or nothing
```

---

## Step 3: Restore the Database

**Option A — Restore to a new database (recommended — safer):**

```bash
# Create a fresh database
createdb crewora_restored

# Restore the backup into it
gunzip -c /backups/crewora/crewora_20260115_020000.sql.gz | \
  psql -d crewora_restored

# Verify data exists
psql -d crewora_restored -c "SELECT COUNT(*) FROM \"Customer\";"
psql -d crewora_restored -c "SELECT COUNT(*) FROM \"Worker\";"
psql -d crewora_restored -c "SELECT COUNT(*) FROM \"Job\";"
```

If counts look correct, rename databases:
```bash
# Drop the corrupted database
dropdb crewora

# Rename restored db to production name
psql -c "ALTER DATABASE crewora_restored RENAME TO crewora;"
```

**Option B — Restore directly (faster, riskier):**

```bash
# Drop and recreate
dropdb crewora
createdb crewora

# Restore
gunzip -c /backups/crewora/crewora_20260115_020000.sql.gz | psql -d crewora
```

---

## Step 4: Verify Restoration

**Run these queries to confirm the database is healthy:**

```sql
-- Check user counts
SELECT 'Customers' AS entity, COUNT(*) AS count FROM "Customer" WHERE "deleted_at" IS NULL
UNION ALL
SELECT 'Workers', COUNT(*) FROM "Worker" WHERE "deleted_at" IS NULL
UNION ALL
SELECT 'Jobs', COUNT(*) FROM "Job" WHERE "deleted_at" IS NULL;

-- Check recent activity (last 7 days)
SELECT COUNT(*) AS "jobs_last_7_days"
FROM "Job"
WHERE "created_at" >= NOW() - INTERVAL '7 days'
  AND "deleted_at" IS NULL;

-- Check indexes exist
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'Job';
```

---

## Step 5: Restart the Application

```bash
# If using Docker:
docker start crewora-backend

# If using systemd:
sudo systemctl start crewora-backend

# If using PM2:
pm2 start crewora-backend
```

**Verify the app is healthy:**
```bash
curl http://localhost:5000/api/health
# Expected: {"status":"ok","database":"connected","redis":"connected","uptime":30,"version":"1.0.0","timestamp":"..."}
```

**Run a quick smoke test:**
```bash
./backend/scripts/smoke-test.sh http://localhost:5000
```

---

## Step 6: Post-Restore Checklist

- [ ] Health endpoint returns `status: ok`
- [ ] Smoke tests pass (all 5 checks)
- [ ] Customer mobile app can log in
- [ ] Worker mobile app can log in
- [ ] New job requests can be created
- [ ] Notifications are being sent
- [ ] Admin dashboard loads correctly
- [ ] No error spikes in Sentry
- [ ] Tonight's backup ran successfully

---

## Database Disaster Scenarios

### "I accidentally deleted a user"
**Quick fix** — the data is soft-deleted (deleted_at is set, not actually removed):
```sql
UPDATE "Customer"
SET "deleted_at" = NULL, "is_active" = true
WHERE "phone" = '+919876543210';
```

### "The database is corrupted"
**Full restore from backup** — follow Steps 1-5 above.

### "Only one table has bad data"
**Partial restore** — extract just one table:
```bash
# Extract specific table from backup
gunzip -c crewora_backup.sql.gz | grep -A 10000 'COPY "Job"' > job_restore.sql

# Restore just that table
psql -d crewora -c "TRUNCATE \"Job\";"
psql -d crewora -f job_restore.sql
```

### "I need data from 2 hours ago (not yesterday's backup)"
**Point-in-time recovery** — see Section 4 below.

---

## Point-in-Time Recovery (PITR)

### For Supabase users:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Database** → **Backups**
4. Click **Point-in-Time Recovery**
5. Select the date and time (must be within the last 7 days)
6. Click **Restore**
7. Supabase will create a new database with the restored data
8. Update your `DATABASE_URL` to point to the new database

### For self-hosted PostgreSQL:

1. Ensure WAL archiving is enabled in `postgresql.conf`:
   ```
   archive_mode = on
   archive_command = 'cp %p /wal_archive/%f'
   ```

2. Restore to a point in time:
   ```bash
   # Create a recovery.conf file
   echo "restore_command = 'cp /wal_archive/%f %p'" > /var/lib/postgresql/data/recovery.conf
   echo "recovery_target_time = '2026-01-15 14:30:00 IST'" >> recovery.conf

   # Restart PostgreSQL — it will replay WALs to the target time
   sudo systemctl restart postgresql
   ```

---

## Emergency Contacts

| Role | Contact |
|---|---|
| Lead Developer | dev-lead@crewora.in |
| DevOps Engineer | devops@crewora.in |
| Database Admin | dba@crewora.in |
| CEO (emergency only) | ceo@crewora.in |

---

> **Last updated:** June 2026
> **Tested:** Yes — restore procedure verified in staging environment
