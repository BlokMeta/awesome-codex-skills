import { expo } from '@better-auth/expo';
import { passkey } from '@better-auth/passkey';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { bearer, organization, twoFactor } from 'better-auth/plugins';
import { ulid } from 'ulid';
import type { Database } from '../../../db/client.js';
import { ac, roles } from '../application/access-control.js';
import type { EmailSender } from '../application/email-sender.js';
import type { AuthConfig } from './auth-env.js';
import {
  authAccounts,
  invitations,
  memberships,
  operators,
  passkeys,
  sessions,
  twoFactors,
  verifications,
  workspaces,
} from './schema.js';

interface AuthDeps {
  readonly db: Database;
  readonly config: AuthConfig;
  readonly email: EmailSender;
}

const DAY = 86_400;

/**
 * better-auth instance (ADR-0007). Web uses HttpOnly cookies, mobile the bearer token handed out
 * through `set-auth-token` and stored in SecureStore. Workspaces are better-auth organizations
 * mapped onto our own tables, so membership rows written here are the ones the domain reads.
 */
export function createAuth({ db, config, email }: AuthDeps) {
  const webHost = new URL(config.webUrl).hostname;
  return betterAuth({
    appName: 'Heliograph',
    baseURL: config.apiUrl,
    basePath: '/v1/auth',
    secret: config.secret,
    trustedOrigins: [config.webUrl, `${config.mobileScheme}://`],
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        operators,
        sessions,
        authAccounts,
        verifications,
        workspaces,
        memberships,
        invitations,
        passkeys,
        twoFactors,
      },
    }),
    advanced: {
      cookiePrefix: 'hg',
      useSecureCookies: config.production,
      database: { generateId: () => ulid() },
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 10,
      requireEmailVerification: config.requireEmailVerification,
      sendResetPassword: async ({ user, url }) => {
        await email.send({ to: user.email, subject: 'auth.resetPassword.subject', text: url });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await email.send({ to: user.email, subject: 'auth.verifyEmail.subject', text: url });
      },
    },
    session: {
      modelName: 'sessions',
      fields: { userId: 'operatorId' },
      expiresIn: 30 * DAY,
      updateAge: DAY,
      freshAge: DAY,
      // No signed session cache: revocation and workspace switches must be visible on the very
      // next request (CLAUDE.md rule 13). One indexed session lookup per request is the price.
      cookieCache: { enabled: false },
    },
    user: {
      modelName: 'operators',
      additionalFields: {
        locale: { type: 'string', required: false, defaultValue: 'tr', input: true },
        timezone: { type: 'string', required: false, defaultValue: 'Europe/Istanbul', input: true },
        isSuperadmin: { type: 'boolean', required: false, defaultValue: false, input: false },
      },
    },
    account: { modelName: 'authAccounts', fields: { userId: 'operatorId' } },
    verification: { modelName: 'verifications' },
    plugins: [
      organization({
        ac,
        roles,
        creatorRole: 'owner',
        invitationExpiresIn: 7 * DAY,
        cancelPendingInvitationsOnReInvite: true,
        schema: {
          session: { fields: { activeOrganizationId: 'activeWorkspaceId' } },
          organization: { modelName: 'workspaces' },
          member: {
            modelName: 'memberships',
            fields: { organizationId: 'workspaceId', userId: 'operatorId' },
          },
          invitation: {
            modelName: 'invitations',
            fields: { organizationId: 'workspaceId' },
          },
        },
        sendInvitationEmail: async (data) => {
          await email.send({
            to: data.email,
            subject: 'auth.invitation.subject',
            text: `${config.webUrl}/invite/${data.id}`,
          });
        },
      }),
      twoFactor({
        issuer: 'Heliograph',
        schema: {
          twoFactor: { modelName: 'twoFactors', fields: { userId: 'operatorId' } },
        },
      }),
      passkey({
        rpID: webHost,
        rpName: 'Heliograph',
        origin: config.webUrl,
        schema: { passkey: { modelName: 'passkeys', fields: { userId: 'operatorId' } } },
      }),
      bearer(),
      expo(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type SessionContext = Auth['$Infer']['Session'];
