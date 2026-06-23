-- ============================================================
-- Query 1: Provider browsing open requests
-- Most frequent read. Uses keyset/cursor pagination (NOT offset)
-- for stable pagination under high write load.
-- ============================================================
-- :cursor_created_at  — WHERE created_at < this value (optional, NULL for first page)
-- :cursor_id          — WHERE id < this value (tiebreaker, optional)
-- :trade_category     — filter by category (optional)
-- :page_size          — number of results per page (default 20)
-- ============================================================

SELECT
  j."id",
  j."title",
  j."description",
  j."trade_category",
  j."address",
  j."latitude",
  j."longitude",
  j."city",
  j."urgency",
  j."scheduled_at",
  j."status",
  j."created_at",
  j."posted_at",
  j."customer_id",
  c."name" AS "customer_name"
FROM "Job" j
LEFT JOIN "Customer" c ON c."id" = j."customer_id"
WHERE j."status" = 'open'
  AND j."deleted_at" IS NULL
  AND (:trade_category IS NULL OR j."trade_category" = :trade_category)
  AND (
    (:cursor_created_at IS NULL AND :cursor_id IS NULL)
    OR (j."created_at", j."id") < (:cursor_created_at, :cursor_id)
  )
ORDER BY j."created_at" DESC, j."id" DESC
LIMIT :page_size;
