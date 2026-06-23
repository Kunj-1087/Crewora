-- ============================================================
-- CREWORA — Soft Delete Migration
-- ============================================================
-- Adds deleted_at columns to all major tables.
-- Replaces physical DELETEs with logical UPDATEs.
-- All read queries will include WHERE deleted_at IS NULL.
-- ============================================================

BEGIN;

-- ─── Customer ─────────────────────────────────────────────────
ALTER TABLE "Customer"
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ DEFAULT NULL;

-- ─── Worker ───────────────────────────────────────────────────
ALTER TABLE "Worker"
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ DEFAULT NULL;

-- ─── Admin ────────────────────────────────────────────────────
ALTER TABLE "Admin"
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ DEFAULT NULL;

-- ─── Job ──────────────────────────────────────────────────────
ALTER TABLE "Job"
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ DEFAULT NULL;

-- ─── Match ────────────────────────────────────────────────────
ALTER TABLE "Match"
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ DEFAULT NULL;

-- ─── Review ──────────────────────────────────────────────────
ALTER TABLE "Review"
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ DEFAULT NULL;

-- ─── Message ──────────────────────────────────────────────────
ALTER TABLE "Message"
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ DEFAULT NULL;

-- ─── Notification ────────────────────────────────────────────
ALTER TABLE "Notification"
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ DEFAULT NULL;

-- ─── PortfolioItem ────────────────────────────────────────────
ALTER TABLE "PortfolioItem"
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ DEFAULT NULL;

-- ─── DeviceToken ──────────────────────────────────────────────
ALTER TABLE "DeviceToken"
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ DEFAULT NULL;

COMMIT;
