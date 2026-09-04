-- Runtime role for tenant-scoped transactions (docs/08 §2, docs/11): the API switches to
-- `hg_app` with SET LOCAL ROLE inside withWorkspace(); RLS policies below are bound to it.
-- The role is cluster-wide, so creation is guarded (idempotent, race-safe across parallel DBs).
DO $$
BEGIN
  PERFORM pg_advisory_xact_lock(7264001);
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hg_app') THEN
    CREATE ROLE hg_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
  EXECUTE format('GRANT hg_app TO %I', current_user);
END $$;--> statement-breakpoint
CREATE TYPE "public"."credit_reason" AS ENUM('plan_grant', 'purchase', 'usage', 'refund', 'bonus', 'expiry');--> statement-breakpoint
CREATE TYPE "public"."plan_interval" AS ENUM('month', 'year');--> statement-breakpoint
CREATE TYPE "public"."subscription_provider" AS ENUM('paddle', 'polar', 'iyzico', 'apple', 'google', 'manual');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trialing', 'active', 'past_due', 'paused', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."policy_scope" AS ENUM('global', 'platform', 'workspace');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'rejected', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."membership_role" AS ENUM('owner', 'admin', 'editor', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."erasure_source" AS ENUM('user', 'meta_callback', 'support');--> statement-breakpoint
CREATE TYPE "public"."legal_document" AS ENUM('terms', 'privacy', 'kvkk_aydinlatma', 'kvkk_acik_riza_marketing', 'kvkk_acik_riza_voice', 'kvkk_acik_riza_likeness', 'cookies', 'distance_sale', 'aup', 'ai_processing');--> statement-breakpoint
CREATE TABLE "credit_ledger" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"delta" integer NOT NULL,
	"reason" "credit_reason" NOT NULL,
	"ref_type" text,
	"ref_id" text,
	"balance_after" integer NOT NULL,
	"at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "credit_ledger" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "plan_entitlements" (
	"plan_id" text NOT NULL,
	"feature" text NOT NULL,
	"limit_value" numeric(12, 2),
	CONSTRAINT "plan_entitlements_plan_id_feature_pk" PRIMARY KEY("plan_id","feature")
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"interval" "plan_interval" NOT NULL,
	"price_minor" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"public" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"plan_id" text NOT NULL,
	"provider" "subscription_provider" NOT NULL,
	"provider_ref" text,
	"status" "subscription_status" NOT NULL,
	"current_period_start" timestamp with time zone NOT NULL,
	"current_period_end" timestamp with time zone NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"trial_ends_at" timestamp with time zone,
	"seats" integer DEFAULT 1 NOT NULL,
	"extra_accounts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "usage_records" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"feature" text,
	"module" text NOT NULL,
	"provider" text,
	"model" text,
	"unit" text NOT NULL,
	"quantity" numeric(14, 4) NOT NULL,
	"cost_usd" numeric(12, 6) DEFAULT '0' NOT NULL,
	"ref_type" text,
	"ref_id" text,
	"at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "usage_records" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"default_on" boolean DEFAULT false NOT NULL,
	"rules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flags_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "policy_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"scope" "policy_scope" NOT NULL,
	"scope_id" text,
	"value" jsonb NOT NULL,
	"version" integer NOT NULL,
	"effective_from" timestamp with time zone NOT NULL,
	"verified_at" timestamp with time zone NOT NULL,
	"verified_by" text NOT NULL,
	"source_url" text,
	"max_age_days" integer NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "policy_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"operator_id" text NOT NULL,
	"issuer" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"id_token" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"email" text NOT NULL,
	"role" "membership_role" NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"inviter_id" text NOT NULL,
	"team_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invitations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"operator_id" text NOT NULL,
	"role" "membership_role" NOT NULL,
	"invited_by" text,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "operators" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"image" text,
	"locale" text DEFAULT 'tr' NOT NULL,
	"timezone" text DEFAULT 'Europe/Istanbul' NOT NULL,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"is_superadmin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "passkeys" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"public_key" text NOT NULL,
	"operator_id" text NOT NULL,
	"credential_id" text NOT NULL,
	"counter" integer NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean NOT NULL,
	"transports" text,
	"aaguid" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"operator_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"active_workspace_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "two_factors" (
	"id" text PRIMARY KEY NOT NULL,
	"operator_id" text NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"verified" boolean DEFAULT true NOT NULL,
	"failed_verification_count" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"metadata" jsonb,
	"locale" text DEFAULT 'tr' NOT NULL,
	"timezone" text DEFAULT 'Europe/Istanbul' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "consent_records" (
	"id" text PRIMARY KEY NOT NULL,
	"operator_id" text NOT NULL,
	"document" "legal_document" NOT NULL,
	"version" text NOT NULL,
	"accepted_at" timestamp with time zone NOT NULL,
	"withdrawn_at" timestamp with time zone,
	"ip" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "erasure_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text,
	"operator_id" text,
	"channel_id" text,
	"source" "erasure_source" NOT NULL,
	"confirmation_code" text NOT NULL,
	"requested_at" timestamp with time zone NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "erasure_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "plan_entitlements" ADD CONSTRAINT "plan_entitlements_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_inviter_id_operators_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."operators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_invited_by_operators_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passkeys" ADD CONSTRAINT "passkeys_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factors" ADD CONSTRAINT "two_factors_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "credit_ledger_workspace_at_idx" ON "credit_ledger" USING btree ("workspace_id","at","id");--> statement-breakpoint
CREATE UNIQUE INDEX "plans_code_unique" ON "plans" USING btree ("code");--> statement-breakpoint
CREATE INDEX "subscriptions_workspace_created_idx" ON "subscriptions" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "usage_records_workspace_feature_at_idx" ON "usage_records" USING btree ("workspace_id","feature","at");--> statement-breakpoint
CREATE UNIQUE INDEX "policy_entries_target_version_unique" ON "policy_entries" USING btree ("key","scope",coalesce("scope_id", ''),"version");--> statement-breakpoint
CREATE INDEX "policy_entries_key_idx" ON "policy_entries" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_accounts_issuer_account_unique" ON "auth_accounts" USING btree ("issuer","account_id");--> statement-breakpoint
CREATE INDEX "auth_accounts_operator_idx" ON "auth_accounts" USING btree ("operator_id");--> statement-breakpoint
CREATE INDEX "invitations_workspace_idx" ON "invitations" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "invitations_email_idx" ON "invitations" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_operator_workspace_unique" ON "memberships" USING btree ("operator_id","workspace_id");--> statement-breakpoint
CREATE INDEX "memberships_workspace_idx" ON "memberships" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "operators_email_unique" ON "operators" USING btree (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "passkeys_credential_id_unique" ON "passkeys" USING btree ("credential_id");--> statement-breakpoint
CREATE INDEX "passkeys_operator_idx" ON "passkeys" USING btree ("operator_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_unique" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "sessions_operator_idx" ON "sessions" USING btree ("operator_id");--> statement-breakpoint
CREATE INDEX "two_factors_operator_idx" ON "two_factors" USING btree ("operator_id");--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_slug_unique" ON "workspaces" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "consent_records_operator_idx" ON "consent_records" USING btree ("operator_id","document");--> statement-breakpoint
CREATE INDEX "erasure_requests_due_idx" ON "erasure_requests" USING btree ("completed_at","due_at");--> statement-breakpoint
CREATE POLICY "credit_ledger_tenant_isolation" ON "credit_ledger" AS PERMISSIVE FOR ALL TO "hg_app" USING (workspace_id = current_setting('hg.workspace_id', true)) WITH CHECK (workspace_id = current_setting('hg.workspace_id', true));--> statement-breakpoint
CREATE POLICY "subscriptions_tenant_isolation" ON "subscriptions" AS PERMISSIVE FOR ALL TO "hg_app" USING (workspace_id = current_setting('hg.workspace_id', true)) WITH CHECK (workspace_id = current_setting('hg.workspace_id', true));--> statement-breakpoint
CREATE POLICY "usage_records_tenant_isolation" ON "usage_records" AS PERMISSIVE FOR ALL TO "hg_app" USING (workspace_id = current_setting('hg.workspace_id', true)) WITH CHECK (workspace_id = current_setting('hg.workspace_id', true));--> statement-breakpoint
CREATE POLICY "policy_entries_scope_visibility" ON "policy_entries" AS PERMISSIVE FOR ALL TO "hg_app" USING (scope <> 'workspace' OR scope_id = current_setting('hg.workspace_id', true)) WITH CHECK (scope <> 'workspace' OR scope_id = current_setting('hg.workspace_id', true));--> statement-breakpoint
CREATE POLICY "invitations_tenant_isolation" ON "invitations" AS PERMISSIVE FOR ALL TO "hg_app" USING (workspace_id = current_setting('hg.workspace_id', true)) WITH CHECK (workspace_id = current_setting('hg.workspace_id', true));--> statement-breakpoint
CREATE POLICY "memberships_tenant_isolation" ON "memberships" AS PERMISSIVE FOR ALL TO "hg_app" USING (workspace_id = current_setting('hg.workspace_id', true)) WITH CHECK (workspace_id = current_setting('hg.workspace_id', true));--> statement-breakpoint
CREATE POLICY "erasure_requests_tenant_isolation" ON "erasure_requests" AS PERMISSIVE FOR ALL TO "hg_app" USING (workspace_id IS NULL OR workspace_id = current_setting('hg.workspace_id', true)) WITH CHECK (workspace_id IS NULL OR workspace_id = current_setting('hg.workspace_id', true));
--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO hg_app;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO hg_app;--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO hg_app;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO hg_app;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO hg_app;
