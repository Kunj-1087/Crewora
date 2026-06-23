/**
 * Admin Analytics Dashboard API
 *
 * Endpoints for platform metrics that a buyer looks at in the first
 * 10 minutes of due diligence:
 * - DAU/WAU/MAU
 * - Request volume by category and status
 * - Provider application rate
 * - Average time from request to first application
 * - Provider retention
 * - CSV data exports
 */

import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { prisma } from '../../lib/prisma';
import { queryAdminDashboardStats } from '../../db/queries';
import { z } from 'zod';

const router = Router();

// All routes require admin auth
router.use(authenticate('admin'));
router.use(requireAdmin);

// ─── 1. Dashboard Stats ───────────────────────────────────────────────────────

router.get('/analytics/dashboard', async (_req, res, next) => {
  try {
    const stats = await queryAdminDashboardStats();

    // Get request volume by category
    const requestsByCategory: any[] = await prisma.$queryRaw`
      SELECT "trade_category", COUNT(*)::integer AS count
      FROM "Job"
      WHERE "deleted_at" IS NULL
      GROUP BY "trade_category"
      ORDER BY count DESC
    `;

    // Application rate: requests with ≥1 application / total requests
    const applicationRateResult: any[] = await prisma.$queryRaw`
      SELECT
        COUNT(DISTINCT j."id")::integer AS "requests_with_applications",
        (SELECT COUNT(*)::integer FROM "Job" WHERE "deleted_at" IS NULL) AS "total_requests"
      FROM "Job" j
      WHERE EXISTS (
        SELECT 1 FROM "Match" m WHERE m."job_id" = j."id" AND m."deleted_at" IS NULL
      )
      AND j."deleted_at" IS NULL
    `;

    const applicationRate = applicationRateResult[0]?.total_requests > 0
      ? Math.round(
          (applicationRateResult[0].requests_with_applications / applicationRateResult[0].total_requests) * 100
        )
      : 0;

    // Average time from request posted to first application
    const avgTimeResult: any[] = await prisma.$queryRaw`
      SELECT
        COALESCE(
          AVG(
            EXTRACT(EPOCH FROM (m."matched_at" - j."created_at")) / 3600
          ),
          0
        )::double precision AS "avg_hours_to_first_application"
      FROM "Job" j
      INNER JOIN "Match" m ON m."job_id" = j."id"
      WHERE j."deleted_at" IS NULL AND m."deleted_at" IS NULL
        AND m."matched_at" IS NOT NULL
    `;

    const avgHoursToFirstApplication = Math.round(
      (avgTimeResult[0]?.avg_hours_to_first_application || 0) * 10
    ) / 10;

    res.json({
      success: true,
      data: {
        stats,
        requestsByCategory,
        applicationRate: `${applicationRate}%`,
        avgHoursToFirstApplication,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── 2. Active Users (DAU/WAU/MAU) ───────────────────────────────────────────

router.get('/analytics/active-users', async (_req, res, next) => {
  try {
    // Daily active users (customers who created a job today)
    const dau: any[] = await prisma.$queryRaw`
      SELECT
        COUNT(DISTINCT "customer_id")::integer AS "customers",
        (SELECT COUNT(DISTINCT "assigned_worker_id")::integer FROM "Job"
          WHERE "updated_at" >= NOW() - INTERVAL '1 day'
            AND "assigned_worker_id" IS NOT NULL
            AND "deleted_at" IS NULL) AS "workers"
    `;

    // Weekly active users
    const wau: any[] = await prisma.$queryRaw`
      SELECT
        COUNT(DISTINCT "customer_id")::integer AS "customers",
        (SELECT COUNT(DISTINCT "assigned_worker_id")::integer FROM "Job"
          WHERE "updated_at" >= NOW() - INTERVAL '7 days'
            AND "assigned_worker_id" IS NOT NULL
            AND "deleted_at" IS NULL) AS "workers"
      FROM "Job"
      WHERE "created_at" >= NOW() - INTERVAL '7 days'
        AND "deleted_at" IS NULL
    `;

    // Monthly active users
    const mau: any[] = await prisma.$queryRaw`
      SELECT
        COUNT(DISTINCT "customer_id")::integer AS "customers",
        (SELECT COUNT(DISTINCT "assigned_worker_id")::integer FROM "Job"
          WHERE "updated_at" >= NOW() - INTERVAL '30 days'
            AND "assigned_worker_id" IS NOT NULL
            AND "deleted_at" IS NULL) AS "workers"
      FROM "Job"
      WHERE "created_at" >= NOW() - INTERVAL '30 days'
        AND "deleted_at" IS NULL
    `;

    res.json({
      success: true,
      data: {
        dau: { customers: dau[0]?.customers || 0, workers: dau[0]?.workers || 0, total: (dau[0]?.customers || 0) + (dau[0]?.workers || 0) },
        wau: { customers: wau[0]?.customers || 0, workers: wau[0]?.workers || 0, total: (wau[0]?.customers || 0) + (wau[0]?.workers || 0) },
        mau: { customers: mau[0]?.customers || 0, workers: mau[0]?.workers || 0, total: (mau[0]?.customers || 0) + (mau[0]?.workers || 0) },
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── 3. Provider Retention ───────────────────────────────────────────────────

router.get('/analytics/provider-retention', async (_req, res, next) => {
  try {
    // Providers who applied in both the previous and current week
    const retention: any[] = await prisma.$queryRaw`
      WITH weekly_applications AS (
        SELECT
          "worker_id",
          DATE_TRUNC('week', "created_at") AS "week_start"
        FROM "Match"
        WHERE "created_at" >= NOW() - INTERVAL '14 days'
          AND "deleted_at" IS NULL
        GROUP BY "worker_id", DATE_TRUNC('week', "created_at")
      )
      SELECT
        COUNT(DISTINCT wa1."worker_id")::integer AS "providers_previous_week",
        COUNT(DISTINCT wa2."worker_id")::integer AS "providers_current_week",
        COUNT(DISTINCT wa1."worker_id") FILTER (WHERE wa2."worker_id" IS NOT NULL)::integer AS "retained_providers"
      FROM weekly_applications wa1
      LEFT JOIN weekly_applications wa2
        ON wa1."worker_id" = wa2."worker_id"
        AND wa2."week_start" = DATE_TRUNC('week', NOW())
      WHERE wa1."week_start" = DATE_TRUNC('week', NOW() - INTERVAL '7 days')
    `;

    const retentionData = retention[0] || {
      providers_previous_week: 0,
      providers_current_week: 0,
      retained_providers: 0,
    };

    const retentionRate = retentionData.providers_previous_week > 0
      ? Math.round((retentionData.retained_providers / retentionData.providers_previous_week) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        ...retentionData,
        retentionRate: `${retentionRate}%`,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── 4. Data Export: Users (CSV) ──────────────────────────────────────────────

router.get('/export/users', async (_req, res, next) => {
  try {
    const customers: any[] = await prisma.$queryRaw`
      SELECT
        "id", "name", "phone", "city", "is_active", "is_verified",
        "created_at", "updated_at"
      FROM "Customer"
      WHERE "deleted_at" IS NULL
      ORDER BY "created_at" DESC
    `;

    const workers: any[] = await prisma.$queryRaw`
      SELECT
        "id", "name", "phone", "city", "trade_categories",
        "verification_status", "is_active", "availability",
        "rating_avg", "total_reviews", "created_at", "updated_at"
      FROM "Worker"
      WHERE "deleted_at" IS NULL
      ORDER BY "created_at" DESC
    `;

    const customerCsv = [
      'id,name,phone,city,is_active,is_verified,created_at,updated_at',
      ...customers.map((c: any) =>
        `"${c.id}","${c.name}","${c.phone}","${c.city || ''}","${c.is_active}","${c.is_verified}","${c.created_at?.toISOString() || ''}","${c.updated_at?.toISOString() || ''}"`
      ),
    ].join('\n');

    const workerCsv = [
      'id,name,phone,city,trade_categories,verification_status,is_active,availability,rating_avg,total_reviews,created_at,updated_at',
      ...workers.map((w: any) =>
        `"${w.id}","${w.name}","${w.phone}","${w.city || ''}","${(w.trade_categories || []).join(';')}","${w.verification_status}","${w.is_active}","${w.availability}","${w.rating_avg || 0}","${w.total_reviews || 0}","${w.created_at?.toISOString() || ''}","${w.updated_at?.toISOString() || ''}"`
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="crewora_users_export_${Date.now()}.csv"`);
    res.send(`${customerCsv}\n\n--- WORKERS ---\n\n${workerCsv}`);
  } catch (error) {
    next(error);
  }
});

// ─── 5. Data Export: Requests (CSV) ───────────────────────────────────────────

router.get('/export/requests', async (_req, res, next) => {
  try {
    const jobs: any[] = await prisma.$queryRaw`
      SELECT
        j."id", j."title", j."trade_category", j."status",
        j."city", j."urgency", j."created_at", j."posted_at",
        j."completed_at", j."cancelled_at",
        c."name" AS "customer_name",
        w."name" AS "worker_name"
      FROM "Job" j
      LEFT JOIN "Customer" c ON c."id" = j."customer_id"
      LEFT JOIN "Worker" w ON w."id" = j."assigned_worker_id"
      WHERE j."deleted_at" IS NULL
      ORDER BY j."created_at" DESC
    `;

    const csv = [
      'id,title,trade_category,status,city,urgency,customer_name,worker_name,created_at,posted_at,completed_at,cancelled_at',
      ...jobs.map((j: any) =>
        `"${j.id}","${(j.title || '').replace(/"/g, '""')}","${j.trade_category || ''}","${j.status}","${j.city || ''}","${j.urgency || ''}","${j.customer_name || ''}","${j.worker_name || ''}","${j.created_at?.toISOString() || ''}","${j.posted_at?.toISOString() || ''}","${j.completed_at?.toISOString() || ''}","${j.cancelled_at?.toISOString() || ''}"`
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="crewora_requests_export_${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

// ─── 6. Audit Log ────────────────────────────────────────────────────────────

const auditLogQuerySchema = z.object({
  page: z.string().optional().transform((v) => parseInt(v || '1', 10)),
  limit: z.string().optional().transform((v) => parseInt(v || '50', 10)),
  adminId: z.string().uuid().optional(),
  action: z.string().optional(),
  targetType: z.string().optional(),
});

router.get('/audit-logs', validate({ query: auditLogQuerySchema }), async (req, res, next) => {
  try {
    const { page, limit, adminId, action, targetType } = req.query as any;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (adminId) where.admin_id = adminId;
    if (action) where.action = action;
    if (targetType) where.target_type = targetType;

    const logs = await prisma.$queryRaw`
      SELECT * FROM "admin_audit_logs"
      WHERE 1=1
        ${adminId ? `AND "admin_id" = ${adminId}` : ''}
        ${action ? `AND "action" = ${action}` : ''}
        ${targetType ? `AND "target_type" = ${targetType}` : ''}
      ORDER BY "created_at" DESC
      LIMIT ${limit} OFFSET ${skip}
    `;

    const totalResult: any[] = await prisma.$queryRaw`
      SELECT COUNT(*)::integer AS count FROM "admin_audit_logs"
      WHERE 1=1
        ${adminId ? `AND "admin_id" = ${adminId}` : ''}
        ${action ? `AND "action" = ${action}` : ''}
        ${targetType ? `AND "target_type" = ${targetType}` : ''}
    `;

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total: totalResult[0]?.count || 0,
          page,
          limit,
          totalPages: Math.ceil((totalResult[0]?.count || 0) / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
