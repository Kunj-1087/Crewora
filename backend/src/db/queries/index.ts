/**
 * Query Wrappers — TypeScript parameterized query functions.
 * NEVER use string interpolation. All queries use $1, $2... parameters.
 */

import { prisma } from '../../lib/prisma';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OpenJobRow {
  id: string;
  title: string;
  description: string;
  trade_category: string;
  address: string;
  latitude: number;
  longitude: number;
  city: string | null;
  urgency: string;
  scheduled_at: Date | null;
  status: string;
  created_at: Date;
  posted_at: Date;
  customer_id: string;
  customer_name: string;
}

export interface JobApplicantRow {
  match_id: string;
  match_status: string;
  matched_at: Date;
  expires_at: Date;
  worker_id: string;
  worker_name: string;
  trade_categories: string[];
  city: string;
  experience_years: number | null;
  bio: string | null;
  verification_status: string;
  profile_photo: string | null;
  hourly_rate: number | null;
  rating_avg: number | null;
  total_reviews: number;
  availability: string;
}

export interface UnreadCountResult {
  unread_count: number;
}

export interface AdminDashboardStats {
  total_customers: number;
  active_customers: number;
  new_customers_7d: number;
  total_providers: number;
  active_providers: number;
  pending_providers: number;
  new_providers_7d: number;
  total_requests: number;
  open_requests: number;
  matched_requests: number;
  in_progress_requests: number;
  completed_requests: number;
  cancelled_requests: number;
  new_requests_7d: number;
  total_applications: number;
  pending_applications: number;
}

// ─── Query 1: Provider browse open jobs (keyset pagination) ──────────────────

export async function queryOpenJobsByCategory(
  params: {
    cursorCreatedAt?: Date;
    cursorId?: string;
    tradeCategory?: string;
    pageSize?: number;
  }
): Promise<OpenJobRow[]> {
  const { cursorCreatedAt, cursorId, tradeCategory, pageSize = 20 } = params;

  const conditions: string[] = [`j."status" = 'open'`, `j."deleted_at" IS NULL`];
  const values: any[] = [];
  let paramIndex = 1;

  if (tradeCategory) {
    conditions.push(`j."trade_category" = $${paramIndex++}`);
    values.push(tradeCategory);
  }

  if (cursorCreatedAt && cursorId) {
    conditions.push(
      `(j."created_at", j."id") < ($${paramIndex++}::timestamptz, $${paramIndex++}::uuid)`
    );
    values.push(cursorCreatedAt, cursorId);
  }

  const whereClause = conditions.join(' AND ');

  const query = `
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
    WHERE ${whereClause}
    ORDER BY j."created_at" DESC, j."id" DESC
    LIMIT $${paramIndex}::integer
  `;
  values.push(pageSize);

  const rows: any[] = await prisma.$queryRawUnsafe(query, ...values);
  return rows as OpenJobRow[];
}

// ─── Query 2: Customer viewing own request applicants ────────────────────────

export async function queryJobApplicants(
  jobId: string,
  customerId: string
): Promise<JobApplicantRow[]> {
  const rows: any[] = await prisma.$queryRaw`
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
    WHERE m."job_id" = ${jobId}
      AND j."customer_id" = ${customerId}
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
      m."matched_at" DESC
  `;
  return rows as JobApplicantRow[];
}

// ─── Query 3: Unread notification count ──────────────────────────────────────

export async function queryUnreadNotificationCount(
  userId: string
): Promise<number> {
  const rows: any[] = await prisma.$queryRaw`
    SELECT COUNT(*)::integer AS "unread_count"
    FROM "Notification"
    WHERE "user_id" = ${userId}
      AND "is_read" = false
      AND "deleted_at" IS NULL
  `;
  const result = rows[0] as UnreadCountResult | undefined;
  return result?.unread_count ?? 0;
}

// ─── Query 4: Worker average rating (from cached columns) ────────────────────
// This is no longer a heavy query — rating_avg and total_reviews are
// stored on the Worker row and kept current via a PostgreSQL trigger.
// The trigger is in migrations/004_rating_trigger.sql.

export async function queryWorkerRating(workerId: string): Promise<{
  rating_avg: number;
  total_reviews: number;
}> {
  const rows: any[] = await prisma.$queryRaw`
    SELECT "rating_avg", "total_reviews"
    FROM "Worker"
    WHERE "id" = ${workerId}
      AND "deleted_at" IS NULL
  `;
  const worker = rows[0] as { rating_avg: number | null; total_reviews: number } | undefined;
  return {
    rating_avg: worker?.rating_avg ?? 0.0,
    total_reviews: worker?.total_reviews ?? 0,
  };
}

// ─── Query 5: Admin dashboard stats (conditional aggregation) ────────────────

export async function queryAdminDashboardStats(): Promise<AdminDashboardStats> {
  const rows: any[] = await prisma.$queryRaw`
    SELECT
      -- Customer counts
      COUNT(DISTINCT c."id") FILTER (WHERE c."deleted_at" IS NULL) AS "total_customers",
      COUNT(DISTINCT c."id") FILTER (WHERE c."is_active" = true AND c."deleted_at" IS NULL) AS "active_customers",
      COUNT(DISTINCT c."id") FILTER (WHERE c."created_at" >= NOW() - INTERVAL '7 days' AND c."deleted_at" IS NULL) AS "new_customers_7d",

      -- Worker counts
      COUNT(DISTINCT w."id") FILTER (WHERE w."deleted_at" IS NULL) AS "total_providers",
      COUNT(DISTINCT w."id") FILTER (WHERE w."is_active" = true AND w."deleted_at" IS NULL) AS "active_providers",
      COUNT(DISTINCT w."id") FILTER (WHERE w."verification_status" = 'pending' AND w."deleted_at" IS NULL) AS "pending_providers",
      COUNT(DISTINCT w."id") FILTER (WHERE w."created_at" >= NOW() - INTERVAL '7 days' AND w."deleted_at" IS NULL) AS "new_providers_7d",

      -- Job counts by status
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
    FROM "Customer" c
    FULL JOIN "Worker" w ON 1=1
    FULL JOIN "Job" j ON 1=1
    FULL JOIN "Match" m ON 1=1
  `;
  return rows[0] as AdminDashboardStats;
}
