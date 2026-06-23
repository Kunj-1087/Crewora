-- ============================================================
-- Query 2: Customer viewing own request applicants
-- Single query — joins applications → provider_profiles →
-- reviews aggregate (avg rating, count). NO N+1.
-- ============================================================
-- :job_id  — the job/request UUID
-- :customer_id — the requesting customer (for ownership check)
-- ============================================================

SELECT
  m."id" AS "match_id",
  m."status" AS "match_status",
  m."matched_at",
  m."expires_at",
  w."id" AS "worker_id",
  w."name" AS "worker_name",
  w."trade_categories",
  w."city",
  w."experience_years",
  w."bio",
  w."verification_status",
  w."profile_photo",
  w."hourly_rate",
  w."rating_avg",
  w."total_reviews",
  w."availability"
FROM "Match" m
INNER JOIN "Job" j ON j."id" = m."job_id"
INNER JOIN "Worker" w ON w."id" = m."worker_id"
WHERE m."job_id" = :job_id
  AND j."customer_id" = :customer_id
  AND j."deleted_at" IS NULL
  AND m."deleted_at" IS NULL
  AND w."deleted_at" IS NULL
ORDER BY
  CASE m."status"
    WHEN 'pending' THEN 0
    WHEN 'accepted' THEN 1
    WHEN 'declined' THEN 2
    WHEN 'expired' THEN 3
  END,
  m."matched_at" DESC;
