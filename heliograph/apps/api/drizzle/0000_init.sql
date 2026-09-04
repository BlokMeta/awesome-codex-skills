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
CREATE TYPE "public"."policy_scope" AS ENUM('global', 'platform', 'workspace');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'rejected', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."membership_role" AS ENUM('owner', 'admin', 'editor', 'viewer');--> statement-breakpoint
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
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_inviter_id_operators_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."operators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_invited_by_operators_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passkeys" ADD CONSTRAINT "passkeys_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factors" ADD CONSTRAINT "two_factors_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
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
CREATE POLICY "policy_entries_scope_visibility" ON "policy_entries" AS PERMISSIVE FOR ALL TO "hg_app" USING (scope <> 'workspace' OR scope_id = current_setting('hg.workspace_id', true)) WITH CHECK (scope <> 'workspace' OR scope_id = current_setting('hg.workspace_id', true));--> statement-breakpoint
CREATE POLICY "invitations_tenant_isolation" ON "invitations" AS PERMISSIVE FOR ALL TO "hg_app" USING (workspace_id = current_setting('hg.workspace_id', true)) WITH CHECK (workspace_id = current_setting('hg.workspace_id', true));--> statement-breakpoint
CREATE POLICY "memberships_tenant_isolation" ON "memberships" AS PERMISSIVE FOR ALL TO "hg_app" USING (workspace_id = current_setting('hg.workspace_id', true)) WITH CHECK (workspace_id = current_setting('hg.workspace_id', true));
--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO hg_app;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO hg_app;--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO hg_app;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO hg_app;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO hg_app;
