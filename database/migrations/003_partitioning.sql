-- ============================================================
-- CREWORA — Table Partitioning Setup
-- ============================================================
-- Sets up monthly partitioning for high-volume, time-series
-- tables: Notification and Otp.
-- Run after 002_add_indexes.sql
-- ============================================================

BEGIN;

-- ─── Notification Partitioning ─────────────────────────────────
-- Create partitioned table for notifications
-- Note: If the table already has data, use migration approach:
--  1. Rename old table
--  2. Create partitioned table
--  3. Insert old data
--  4. Drop old table

ALTER TABLE "Notification" RENAME TO "Notification_old";

CREATE TABLE "Notification" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "link" TEXT,
  "is_read" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("id", "created_at")
) PARTITION BY RANGE ("created_at");

-- Create monthly partitions for the next 12 months
CREATE TABLE "Notification_2026_01" PARTITION OF "Notification"
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE "Notification_2026_02" PARTITION OF "Notification"
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE "Notification_2026_03" PARTITION OF "Notification"
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE "Notification_2026_04" PARTITION OF "Notification"
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE "Notification_2026_05" PARTITION OF "Notification"
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE "Notification_2026_06" PARTITION OF "Notification"
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE "Notification_2026_07" PARTITION OF "Notification"
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE "Notification_2026_08" PARTITION OF "Notification"
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE "Notification_2026_09" PARTITION OF "Notification"
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE "Notification_2026_10" PARTITION OF "Notification"
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE "Notification_2026_11" PARTITION OF "Notification"
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE "Notification_2026_12" PARTITION OF "Notification"
  FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

-- Create partitions for future months beyond 2026
CREATE TABLE "Notification_default" PARTITION OF "Notification" DEFAULT;

-- Copy existing data
INSERT INTO "Notification" ("id", "user_id", "title", "body", "link", "is_read", "created_at")
  SELECT "id", "user_id", "title", "body", "link", "is_read", "created_at"
  FROM "Notification_old";

DROP TABLE "Notification_old";

-- Add indexes on the partitioned table (each partition inherits these)
CREATE INDEX IF NOT EXISTS idx_notification_part_user_read_created
  ON "Notification" ("user_id", "is_read", "created_at" DESC);

CREATE INDEX IF NOT EXISTS idx_notification_part_unread
  ON "Notification" ("user_id", "created_at" DESC)
  WHERE "is_read" = false;

-- ─── OTP Partitioning ──────────────────────────────────────────
-- OTPs are short-lived (5 min expiry) — monthly partitions are fine

ALTER TABLE "Otp" RENAME TO "Otp_old";

CREATE TABLE "Otp" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "phone" TEXT NOT NULL,
  "code_hash" TEXT NOT NULL,
  "user_type" TEXT NOT NULL,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "is_used" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("id", "created_at")
) PARTITION BY RANGE ("created_at");

CREATE TABLE "Otp_2026_01" PARTITION OF "Otp"
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE "Otp_2026_02" PARTITION OF "Otp"
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE "Otp_2026_03" PARTITION OF "Otp"
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE "Otp_2026_04" PARTITION OF "Otp"
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE "Otp_2026_05" PARTITION OF "Otp"
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE "Otp_2026_06" PARTITION OF "Otp"
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE "Otp_2026_07" PARTITION OF "Otp"
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE "Otp_2026_08" PARTITION OF "Otp"
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE "Otp_2026_09" PARTITION OF "Otp"
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE "Otp_2026_10" PARTITION OF "Otp"
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE "Otp_2026_11" PARTITION OF "Otp"
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE "Otp_2026_12" PARTITION OF "Otp"
  FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');
CREATE TABLE "Otp_default" PARTITION OF "Otp" DEFAULT;

-- Copy existing data (code_hash maps to old code column)
INSERT INTO "Otp" ("id", "phone", "code_hash", "user_type", "expires_at", "is_used", "created_at")
  SELECT "id", "phone", "code", "user_type", "expires_at", false, "created_at"
  FROM "Otp_old";

DROP TABLE "Otp_old";

CREATE INDEX IF NOT EXISTS idx_otp_part_lookup
  ON "Otp" ("phone", "is_used", "expires_at");

CREATE INDEX IF NOT EXISTS idx_otp_part_live
  ON "Otp" ("phone", "code_hash")
  WHERE "expires_at" > NOW() AND "is_used" = false;

-- ─── Auto-create monthly partitions via pg_cron ────────────────
-- If pg_cron extension is available, schedule partition creation
-- Alternatively, set up a monthly cron job or application-level check
-- See: https://github.com/citusdata/pg_cron

DO $$
BEGIN
  -- Check if pg_cron is installed
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Create a function to add monthly partitions
    CREATE OR REPLACE FUNCTION create_monthly_partitions()
    RETURNS void AS $$
    DECLARE
      next_month_start DATE;
      next_month_end DATE;
      partition_name TEXT;
      month_label TEXT;
    BEGIN
      next_month_start := DATE_TRUNC('month', NOW() + INTERVAL '2 months');
      next_month_end := next_month_start + INTERVAL '1 month';
      month_label := TO_CHAR(next_month_start, 'YYYY_MM');

      -- Notification partition
      partition_name := 'Notification_' || month_label;
      IF NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = partition_name
      ) THEN
        EXECUTE format(
          'CREATE TABLE %I PARTITION OF "Notification" FOR VALUES FROM (%L) TO (%L)',
          partition_name, next_month_start, next_month_end
        );
      END IF;

      -- Otp partition
      partition_name := 'Otp_' || month_label;
      IF NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = partition_name
      ) THEN
        EXECUTE format(
          'CREATE TABLE %I PARTITION OF "Otp" FOR VALUES FROM (%L) TO (%L)',
          partition_name, next_month_start, next_month_end
        );
      END IF;
    END;
    $$ LANGUAGE plpgsql;

    -- Schedule to run on the 25th of each month (gives 5 days buffer)
    PERFORM cron.schedule('create-monthly-partitions', '0 0 25 * *', 'SELECT create_monthly_partitions();');
  END IF;
END;
$$;

COMMIT;
