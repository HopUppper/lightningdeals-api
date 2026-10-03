-- ==============================================================================
-- Migration: Enable Row Level Security (RLS) & Least-Privilege Access Control
-- Target: Supabase PostgreSQL (public schema)
-- Date: 2026-10-03
-- Security Context:
--   - Authentication Model: Custom Express JWT (stored in public."User" & public."UserSession")
--   - Identity Model: Custom user ID (text/uuid). Does NOT map to auth.users / auth.uid()
--   - PostgREST Exposure: Zero frontend browser usage. All data flows through trusted Express API.
-- ==============================================================================

-- 1. Enable Row Level Security on all 30 public tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApiKey" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApiRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VendorProvider" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MasterTokenLedger" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TokenPackage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TokenLedger" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TrialClaim" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Plan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Model" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SystemSetting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SupportTicket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TicketMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailVerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PhoneOtpCode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PasswordResetToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SecurityLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Coupon" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CouponUsage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CreditTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RewardSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Purchase" ENABLE ROW LEVEL SECURITY;

-- 2. Revoke all default public permissions from PostgREST roles (anon, authenticated)
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated;

-- 3. Configure default privileges to prevent accidental public exposure on newly created tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon, authenticated;

-- Note:
-- The application's Node.js backend connects using the PostgreSQL database owner role (postgres),
-- which bypasses RLS in Postgres. All Express endpoints, customer dashboard queries,
-- rate limiters, token accounting, and admin panels continue to function normally.
