-- ============================================================
-- CREWORA — City Fields for Geographic Expansion
-- ============================================================
-- Adds city field to Job. Worker already has city.
-- This makes geographic expansion a config change, not a
-- schema migration — shows architectural foresight to buyers.
-- ============================================================

BEGIN;

-- ─── Add city to Job ──────────────────────────────────────────
ALTER TABLE "Job"
  ADD COLUMN IF NOT EXISTS "city" TEXT DEFAULT NULL;

-- Index for city-based queries
CREATE INDEX IF NOT EXISTS idx_job_city
  ON "Job" ("city");

-- Backfill city from address field (extract last part as city guess)
-- This is best-effort; admin should verify
UPDATE "Job"
SET "city" = TRIM(SPLIT_PART("address", ',', array_length(string_to_array("address", ','), 1)))
WHERE "city" IS NULL AND "address" IS NOT NULL;

-- ─── Add index on Worker.city ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_worker_city
  ON "Worker" ("city");

-- ─── Add city to Customer for future geo-targeting ────────────
ALTER TABLE "Customer"
  ADD COLUMN IF NOT EXISTS "city" TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_customer_city
  ON "Customer" ("city");

COMMIT;
