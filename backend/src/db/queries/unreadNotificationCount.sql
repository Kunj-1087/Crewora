-- ============================================================
-- Query 3: Unread notification count
-- Called on every app open. Must be a single indexed COUNT,
-- not a fetch-all-then-count.
-- ============================================================
-- :user_id  — the authenticated user's ID
-- ============================================================

SELECT COUNT(*)::integer AS "unread_count"
FROM "Notification"
WHERE "user_id" = :user_id
  AND "is_read" = false
  AND "deleted_at" IS NULL;
