-- ============================================================
-- CREWORA — Admin Audit Log Table
-- ============================================================
-- Records every admin action for compliance and operational
-- maturity. Enterprise buyers require this.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS "admin_audit_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "admin_id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "target_type" TEXT NOT NULL,  -- 'user', 'provider', 'request', 'review', 'system'
  "target_id" TEXT,
  "metadata" JSONB DEFAULT '{}',
  "ip_address" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("id")
);

-- Indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id
  ON "admin_audit_logs" ("admin_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_target
  ON "admin_audit_logs" ("target_type", "target_id");

CREATE INDEX IF NOT EXISTS idx_audit_log_action
  ON "admin_audit_logs" ("action", "created_at" DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at
  ON "admin_audit_logs" ("created_at" DESC);

COMMENT ON TABLE "admin_audit_logs" IS 'Immutable audit trail of all admin actions for compliance';
COMMENT ON COLUMN "admin_audit_logs"."action" IS 'Verb describing the action: verify_provider, reject_provider, suspend_user, delete_listing, etc.';
COMMENT ON COLUMN "admin_audit_logs"."target_type" IS 'Entity type affected by the action';
COMMENT ON COLUMN "admin_audit_logs"."metadata" IS 'Free-form JSON with before/after state or contextual details';

COMMIT;
