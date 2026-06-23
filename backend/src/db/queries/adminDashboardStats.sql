-- ============================================================
-- Query 5: Admin dashboard stats
-- Single query with conditional aggregation — NOT multiple queries.
-- ============================================================

SELECT
  -- Customer counts
  COUNT(DISTINCT c."id") FILTER (WHERE c."deleted_at" IS NULL) AS "total_customers",
  COUNT(DISTINCT c."id") FILTER (WHERE c."is_active" = true AND c."deleted_at" IS NULL) AS "active_customers",
  COUNT(DISTINCT c."id") FILTER (WHERE c."created_at" >= NOW() - INTERVAL '7 days' AND c."deleted_at" IS NULL) AS "new_customers_7d",

  -- Worker (provider) counts
  COUNT(DISTINCT w."id") FILTER (WHERE w."deleted_at" IS NULL) AS "total_providers",
  COUNT(DISTINCT w."id") FILTER (WHERE w."is_active" = true AND w."deleted_at" IS NULL) AS "active_providers",
  COUNT(DISTINCT w."id") FILTER (WHERE w."verification_status" = 'pending' AND w."deleted_at" IS NULL) AS "pending_providers",
  COUNT(DISTINCT w."id") FILTER (WHERE w."created_at" >= NOW() - INTERVAL '7 days' AND w."deleted_at" IS NULL) AS "new_providers_7d",

  -- Job (service request) counts by status
  COUNT(DISTINCT j."id") FILTER (WHERE j."deleted_at" IS NULL) AS "total_requests",
  COUNT(DISTINCT j."id") FILTER (WHERE j."status" = 'open' AND j."deleted_at" IS NULL) AS "open_requests",
  COUNT(DISTINCT j."id") FILTER (WHERE j."status" = 'matched' AND j."deleted_at" IS NULL) AS "matched_requests",
  COUNT(DISTINCT j."id") FILTER (WHERE j."status" = 'in_progress' AND j."deleted_at" IS NULL) AS "in_progress_requests",
  COUNT(DISTINCT j."id") FILTER (WHERE j."status" = 'completed' AND j."deleted_at" IS NULL) AS "completed_requests",
  COUNT(DISTINCT j."id") FILTER (WHERE j."status" = 'cancelled' AND j."deleted_at" IS NULL) AS "cancelled_requests",
  COUNT(DISTINCT j."id") FILTER (WHERE j."created_at" >= NOW() - INTERVAL '7 days' AND j."deleted_at" IS NULL) AS "new_requests_7d",

  -- Match stats
  COUNT(DISTINCT m."id") FILTER (WHERE m."deleted_at" IS NULL) AS "total_applications",
  COUNT(DISTINCT m."id") FILTER (WHERE m."status" = 'pending' AND m."deleted_at" IS NULL) AS "pending_applications"

FROM
  "Customer" c
  CROSS JOIN (SELECT 1) dummy_c
  FULL JOIN "Worker" w ON 1=1
  FULL JOIN "Job" j ON 1=1
  FULL JOIN "Match" m ON 1=1
LIMIT 1;
