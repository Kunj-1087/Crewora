-- ============================================================
-- CREWORA — Rating Trigger & Materialized Worker Stats
-- ============================================================
-- Adds rating_avg and total_reviews columns to Worker,
-- and a PostgreSQL trigger that auto-updates them on Review INSERT.
-- ============================================================

BEGIN;

-- ─── Add cached rating columns to Worker ──────────────────────
ALTER TABLE "Worker"
  ADD COLUMN IF NOT EXISTS "rating_avg" DOUBLE PRECISION DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS "total_reviews" INTEGER DEFAULT 0;

-- ─── Update existing records with computed values ────────────
UPDATE "Worker" w
SET
  "rating_avg" = COALESCE((
    SELECT ROUND(AVG(r."rating")::numeric, 1)::double precision
    FROM "Review" r
    WHERE r."worker_id" = w."id" AND r."reviewer" = 'customer'
  ), 0.0),
  "total_reviews" = COALESCE((
    SELECT COUNT(*)
    FROM "Review" r
    WHERE r."worker_id" = w."id" AND r."reviewer" = 'customer'
  ), 0);

-- ─── Trigger Function: Update Worker Rating Stats on Review Insert ───
CREATE OR REPLACE FUNCTION update_worker_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the worker's cached rating stats
  UPDATE "Worker"
  SET
    "rating_avg" = (
      SELECT ROUND(AVG(r."rating")::numeric, 1)::double precision
      FROM "Review" r
      WHERE r."worker_id" = NEW."worker_id" AND r."reviewer" = 'customer'
    ),
    "total_reviews" = (
      SELECT COUNT(*)
      FROM "Review" r
      WHERE r."worker_id" = NEW."worker_id" AND r."reviewer" = 'customer'
    )
  WHERE "id" = NEW."worker_id";

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── Trigger Function: Update Worker Rating Stats on Review Delete ───
CREATE OR REPLACE FUNCTION update_worker_rating_stats_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE "Worker"
  SET
    "rating_avg" = (
      SELECT COALESCE(ROUND(AVG(r."rating")::numeric, 1)::double precision, 0.0)
      FROM "Review" r
      WHERE r."worker_id" = OLD."worker_id" AND r."reviewer" = 'customer'
    ),
    "total_reviews" = (
      SELECT COUNT(*)
      FROM "Review" r
      WHERE r."worker_id" = OLD."worker_id" AND r."reviewer" = 'customer'
    )
  WHERE "id" = OLD."worker_id";

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ─── Apply Triggers ───────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_review_insert_update_worker ON "Review";
CREATE TRIGGER trg_review_insert_update_worker
  AFTER INSERT ON "Review"
  FOR EACH ROW
  EXECUTE FUNCTION update_worker_rating_stats();

DROP TRIGGER IF EXISTS trg_review_delete_update_worker ON "Review";
CREATE TRIGGER trg_review_delete_update_worker
  AFTER DELETE ON "Review"
  FOR EACH ROW
  EXECUTE FUNCTION update_worker_rating_stats_delete();

COMMIT;
