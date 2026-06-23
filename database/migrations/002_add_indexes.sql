-- ============================================================
-- CREWORA — Database Index Strategy Migration
-- ============================================================
-- Adds performance-critical indexes, partial indexes, and
-- composite indexes based on observed query patterns.
-- Run: psql $DATABASE_URL -f migrations/002_add_indexes.sql
-- ============================================================

BEGIN;

-- ─── Users (Customer, Worker, Admin already have unique phone/mobile) ───
-- Note: Customer.phone and Worker.phone already have @unique constraints
-- Customer: created_at already indexed by default, adding role-based composite

-- Customer: index on created_at DESC for time-series queries
CREATE INDEX IF NOT EXISTS idx_customer_created_at_desc
  ON "Customer" ("created_at" DESC);

-- Worker: index on created_at DESC for time-series queries  
CREATE INDEX IF NOT EXISTS idx_worker_created_at_desc
  ON "Worker" ("created_at" DESC);

-- Admin: index on role + created_at for admin pagination
CREATE INDEX IF NOT EXISTS idx_admin_role_created_at
  ON "Admin" ("role", "created_at" DESC);

-- ─── Job (maps to existing "Job" model) ──────────────────────────
-- Composite: customer browsing own jobs filtered by status
CREATE INDEX IF NOT EXISTS idx_job_customer_status
  ON "Job" ("customer_id", "status");

-- Composite: provider (worker) browsing open jobs sorted by recency
CREATE INDEX IF NOT EXISTS idx_job_status_created_at
  ON "Job" ("status", "created_at" DESC);

-- Partial index: only open jobs (most frequent provider-side query)
CREATE INDEX IF NOT EXISTS idx_job_open_partial
  ON "Job" ("created_at" DESC)
  WHERE "status" = 'open';

-- Index on lat/lng for future proximity queries
CREATE INDEX IF NOT EXISTS idx_job_location
  ON "Job" ("latitude", "longitude");

-- Index on trade_category for filtering open jobs
CREATE INDEX IF NOT EXISTS idx_job_trade_category
  ON "Job" ("trade_category");

-- ─── Match (maps to existing "Match" model — applications) ──────────
-- Composite index: provider browsing own applications by status
CREATE INDEX IF NOT EXISTS idx_match_worker_status
  ON "Match" ("worker_id", "status");

-- Composite index: jobId lookups (already covered by @@unique([jobId, workerId]))
-- Index on status + createdAt for filtering
CREATE INDEX IF NOT EXISTS idx_match_status_created_at
  ON "Match" ("status", "created_at" DESC);

-- ─── Notification ──────────────────────────────────────────────
-- Primary query: user's notifications sorted by recency, filtered by read/unread
CREATE INDEX IF NOT EXISTS idx_notification_user_read_created
  ON "Notification" ("user_id", "is_read", "created_at" DESC);

-- Partial index: unread notifications only (for count queries)
CREATE INDEX IF NOT EXISTS idx_notification_unread_partial
  ON "Notification" ("user_id", "created_at" DESC)
  WHERE "is_read" = false;

-- ─── Review ────────────────────────────────────────────────────
-- All reviews for a provider (worker)
CREATE INDEX IF NOT EXISTS idx_review_worker_id
  ON "Review" ("worker_id");

-- Unique index: one review per customer per booking
-- This already has @@unique([jobId, reviewer]), add one for (customer_id, request_id) if needed
CREATE UNIQUE INDEX IF NOT EXISTS idx_review_customer_job_unique
  ON "Review" ("customer_id", "job_id");

-- Index on rating for analytics queries
CREATE INDEX IF NOT EXISTS idx_review_rating
  ON "Review" ("rating");

-- ─── OTP ───────────────────────────────────────────────────────
-- OTP verification lookup
CREATE INDEX IF NOT EXISTS idx_otp_phone_used_expires
  ON "Otp" ("phone", "created_at" DESC);

-- Partial index: only live (non-expired) OTPs
CREATE INDEX IF NOT EXISTS idx_otp_live_partial
  ON "Otp" ("phone", "code")
  WHERE "expires_at" > NOW();

-- ─── DeviceToken ──────────────────────────────────────────────
-- Lookup by userId for push notifications
CREATE INDEX IF NOT EXISTS idx_device_token_user
  ON "DeviceToken" ("user_id");

-- ─── Message ───────────────────────────────────────────────────
-- Composite: conversation lookup (sender + receiver)
CREATE INDEX IF NOT EXISTS idx_message_conversation
  ON "Message" ("sender_id", "receiver_id", "created_at" DESC);

-- ─── UNIQUE Constraints ─────────────────────────────────────────
-- Prevent duplicate applications at DB level
-- Note: Match already has @@unique([jobId, workerId]), but adding explicit index
CREATE UNIQUE INDEX IF NOT EXISTS idx_match_job_worker_unique
  ON "Match" ("job_id", "worker_id");

COMMIT;
