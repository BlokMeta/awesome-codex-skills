import type {
  ConfigReader,
  ConnectedAccount,
  OAuthExchangeInput,
  OAuthProvider,
  OAuthStartInput,
  OAuthTokens,
  Platform,
} from '@heliograph/domain';
import { z } from 'zod';
import { ProviderNotConfiguredError } from '../../application/provider-errors.js';
import { form, type HttpFetch, jsonOrThrow } from './http.js';

/** `platform.oauth` config value (tooling/seed/config.ts); endpoints are never hard-coded here. */
const OAuthEndpointsSchema = z.object({
  authorizeUrl: z.string().url(),
  tokenUrl: z.string().url(),
  longLivedUrl: z.string().url().optional(),
  apiBase: z.string().url(),
  scopes: z.array(z.string()),
  pkce: z.boolean(),
  tokenLifetimeDays: z.number().nullable(),
});
type OAuthEndpoints = z.infer<typeof OAuthEndpointsSchema>;

interface ClientCredentials {
  readonly clientId: string;
  readonly clientSecret: string;
}

interface TokenContext {
  readonly endpoints: OAuthEndpoints;
  readonly client: ClientCredentials;
  readonly fetch: HttpFetch;
  readonly now: () => Date;
}

/**
 * What differs between the official OAuth 2.0 flows: parameter names, how scopes are joined,
 * where the client secret travels and the shape of the identity call. Everything else
 * (state, PKCE, redirect URI, storage) is shared.
 */
interface PlatformSpec {
  readonly platform: Exclude<Platform, 'telegram'>;
  readonly env: { readonly clientId: string; readonly clientSecret: string };
  readonly scopeSeparator: ' ' | ',';
  readonly clientIdParam: 'client_id' | 'client_key';
  readonly extraAuthorizeParams?: Record<string, string>;
  /** X sends the confidential client's secret as HTTP Basic; the others as a form field. */
  readonly tokenAuth: 'form' | 'basic';
  readonly parseTokens: (raw: unknown, ctx: TokenContext) => Promise<OAuthTokens>;
  readonly whoAmI: (accessToken: string, ctx: TokenContext) => Promise<ConnectedAccount>;
  readonly refresh?: (refreshToken: string, ctx: TokenContext) => Promise<OAuthTokens>;
}

const secondsFromNow = (now: Date, seconds: number | undefined): Date | null =>
  typeof seconds === 'number' && Number.isFinite(seconds)
    ? new Date(now.getTime() + seconds * 1000)
    : null;

const StandardTokenSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().optional(),
  expires_in: z.number().optional(),
  scope: z.string().optional(),
});

const parseStandardTokens = async (
  raw: unknown,
  ctx: TokenContext,
  scopeSeparator: string,
): Promise<OAuthTokens> => {
  const t = StandardTokenSchema.parse(raw);
  return {
    accessToken: t.access_token,
    refreshToken: t.refresh_token ?? null,
    expiresAt: secondsFromNow(ctx.now(), t.expires_in),
    scopes: t.scope ? t.scope.split(scopeSeparator).filter(Boolean) : ctx.endpoints.scopes,
  };
};

const refreshWithForm =
  (spec: Pick<PlatformSpec, 'platform' | 'clientIdParam' | 'tokenAuth' | 'scopeSeparator'>) =>
  async (refreshToken: string, ctx: TokenContext): Promise<OAuthTokens> => {
    const res = await ctx.fetch(ctx.endpoints.tokenUrl, {
      method: 'POST',
      headers: tokenHeaders(spec.tokenAuth, ctx.client),
      body: form({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        [spec.clientIdParam]: ctx.client.clientId,
        ...(spec.tokenAuth === 'form' ? { client_secret: ctx.client.clientSecret } : {}),
      }),
    });
    const tokens = await parseStandardTokens(
      await jsonOrThrow(spec.platform, res),
      ctx,
      spec.scopeSeparator,
    );
    // Providers that rotate refresh tokens send a new one; the others keep the old one valid.
    return tokens.refreshToken ? tokens : { ...tokens, refreshToken };
  };

function tokenHeaders(mode: 'form' | 'basic', client: ClientCredentials): Record<string, string> {
  const headers: Record<string, string> = {
    'content-type': 'application/x-www-form-urlencoded',
    accept: 'application/json',
  };
  if (mode === 'basic') {
    headers['authorization'] =
      `Basic ${Buffer.from(`${client.clientId}:${client.clientSecret}`).toString('base64')}`;
  }
  return headers;
}

/** Meta's Instagram/Threads flows: short-lived code exchange, then a long-lived (60 d) token. */
const metaSpec = (
  platform: 'instagram' | 'threads',
  env: PlatformSpec['env'],
  exchangeGrant: string,
  refreshGrant: string,
): PlatformSpec => ({
  platform,
  env,
  scopeSeparator: ',',
  clientIdParam: 'client_id',
  tokenAuth: 'form',
  parseTokens: async (raw, ctx) => {
    const short = z.object({ access_token: z.string().min(1) }).parse(raw);
    if (!ctx.endpoints.longLivedUrl)
      throw new Error(`platform.oauth[${platform}].longLivedUrl missing`);
    const url = new URL(ctx.endpoints.longLivedUrl);
    url.searchParams.set('grant_type', exchangeGrant);
    url.searchParams.set('client_secret', ctx.client.clientSecret);
    url.searchParams.set('access_token', short.access_token);
    const long = StandardTokenSchema.parse(
      await jsonOrThrow(platform, await ctx.fetch(url.toString())),
    );
    return {
      accessToken: long.access_token,
      refreshToken: null,
      expiresAt: secondsFromNow(ctx.now(), long.expires_in),
      scopes: ctx.endpoints.scopes,
    };
  },
  whoAmI: async (accessToken, ctx) => {
    const url = new URL(`${ctx.endpoints.apiBase}/me`);
    url.searchParams.set('fields', 'id,username,name');
    url.searchParams.set('access_token', accessToken);
    const me = z
      .object({ id: z.string(), username: z.string(), name: z.string().optional() })
      .parse(await jsonOrThrow(platform, await ctx.fetch(url.toString())));
    return { externalAccountId: me.id, handle: me.username, displayName: me.name ?? me.username };
  },
  // Long-lived tokens are refreshed with the token itself (no refresh token in these flows).
  refresh: async (currentToken, ctx) => {
    const url = new URL(`${ctx.endpoints.apiBase}/refresh_access_token`);
    url.searchParams.set('grant_type', refreshGrant);
    url.searchParams.set('access_token', currentToken);
    const t = StandardTokenSchema.parse(
      await jsonOrThrow(platform, await ctx.fetch(url.toString())),
    );
    return {
      accessToken: t.access_token,
      refreshToken: null,
      expiresAt: secondsFromNow(ctx.now(), t.expires_in),
      scopes: ctx.endpoints.scopes,
    };
  },
});

const bearer = (token: string) => ({
  authorization: `Bearer ${token}`,
  accept: 'application/json',
});

export const PLATFORM_SPECS: Record<Exclude<Platform, 'telegram'>, PlatformSpec> = {
  instagram: metaSpec(
    'instagram',
    { clientId: 'HG_META_APP_ID', clientSecret: 'HG_META_APP_SECRET' },
    'ig_exchange_token',
    'ig_refresh_token',
  ),
  threads: metaSpec(
    'threads',
    { clientId: 'HG_THREADS_APP_ID', clientSecret: 'HG_THREADS_APP_SECRET' },
    'th_exchange_token',
    'th_refresh_token',
  ),
  tiktok: {
    platform: 'tiktok',
    env: { clientId: 'HG_TIKTOK_CLIENT_KEY', clientSecret: 'HG_TIKTOK_CLIENT_SECRET' },
    scopeSeparator: ',',
    clientIdParam: 'client_key',
    tokenAuth: 'form',
    parseTokens: (raw, ctx) => parseStandardTokens(raw, ctx, ','),
    whoAmI: async (accessToken, ctx) => {
      const url = new URL(`${ctx.endpoints.apiBase}/user/info/`);
      url.searchParams.set('fields', 'open_id,display_name,username');
      const body = z
        .object({
          data: z.object({
            user: z.object({
              open_id: z.string(),
              display_name: z.string().optional(),
              username: z.string().optional(),
            }),
          }),
        })
        .parse(
          await jsonOrThrow(
            'tiktok',
            await ctx.fetch(url.toString(), { headers: bearer(accessToken) }),
          ),
        );
      const u = body.data.user;
      return {
        externalAccountId: u.open_id,
        handle: u.username ?? u.display_name ?? u.open_id,
        displayName: u.display_name ?? u.username ?? '',
      };
    },
    refresh: refreshWithForm({
      platform: 'tiktok',
      clientIdParam: 'client_key',
      tokenAuth: 'form',
      scopeSeparator: ',',
    }),
  },
  youtube: {
    platform: 'youtube',
    env: { clientId: 'HG_GOOGLE_CLIENT_ID', clientSecret: 'HG_GOOGLE_CLIENT_SECRET' },
    scopeSeparator: ' ',
    clientIdParam: 'client_id',
    extraAuthorizeParams: {
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
    },
    tokenAuth: 'form',
    parseTokens: (raw, ctx) => parseStandardTokens(raw, ctx, ' '),
    whoAmI: async (accessToken, ctx) => {
      const url = new URL(`${ctx.endpoints.apiBase}/channels`);
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('mine', 'true');
      const body = z
        .object({
          items: z
            .array(
              z.object({
                id: z.string(),
                snippet: z.object({ title: z.string(), customUrl: z.string().optional() }),
              }),
            )
            .default([]),
        })
        .parse(
          await jsonOrThrow(
            'youtube',
            await ctx.fetch(url.toString(), { headers: bearer(accessToken) }),
          ),
        );
      const ch = body.items[0];
      if (!ch) throw new Error('youtube: the Google account has no channel');
      return {
        externalAccountId: ch.id,
        handle: ch.snippet.customUrl?.replace(/^@/, '') ?? ch.id,
        displayName: ch.snippet.title,
      };
    },
    refresh: refreshWithForm({
      platform: 'youtube',
      clientIdParam: 'client_id',
      tokenAuth: 'form',
      scopeSeparator: ' ',
    }),
  },
  x: {
    platform: 'x',
    env: { clientId: 'HG_X_CLIENT_ID', clientSecret: 'HG_X_CLIENT_SECRET' },
    scopeSeparator: ' ',
    clientIdParam: 'client_id',
    tokenAuth: 'basic',
    parseTokens: (raw, ctx) => parseStandardTokens(raw, ctx, ' '),
    whoAmI: async (accessToken, ctx) => {
      const body = z
        .object({ data: z.object({ id: z.string(), username: z.string(), name: z.string() }) })
        .parse(
          await jsonOrThrow(
            'x',
            await ctx.fetch(`${ctx.endpoints.apiBase}/users/me`, { headers: bearer(accessToken) }),
          ),
        );
      return {
        externalAccountId: body.data.id,
        handle: body.data.username,
        displayName: body.data.name,
      };
    },
    refresh: refreshWithForm({
      platform: 'x',
      clientIdParam: 'client_id',
      tokenAuth: 'basic',
      scopeSeparator: ' ',
    }),
  },
};

interface OAuth2ProviderDeps {
  readonly config: ConfigReader;
  readonly fetch: HttpFetch;
  readonly env: NodeJS.ProcessEnv;
  readonly now: () => Date;
}

/** One instance per platform; endpoints are re-read from config on every call (TTL cache inside). */
export class OAuth2Provider implements OAuthProvider {
  readonly platform: Platform;

  constructor(
    private readonly spec: PlatformSpec,
    private readonly deps: OAuth2ProviderDeps,
  ) {
    this.platform = spec.platform;
  }

  get usesPkce(): boolean {
    // Cheap and synchronous for the domain port; the config value is authoritative at start().
    return (
      this.spec.platform === 'tiktok' ||
      this.spec.platform === 'youtube' ||
      this.spec.platform === 'x'
    );
  }

  async authorizeUrl(input: OAuthStartInput): Promise<string> {
    const { endpoints, client } = await this.context();
    const url = new URL(endpoints.authorizeUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set(this.spec.clientIdParam, client.clientId);
    url.searchParams.set('redirect_uri', input.redirectUri);
    url.searchParams.set('scope', endpoints.scopes.join(this.spec.scopeSeparator));
    url.searchParams.set('state', input.state);
    if (endpoints.pkce) {
      if (!input.codeChallenge) throw new Error(`${this.platform} requires PKCE`);
      url.searchParams.set('code_challenge', input.codeChallenge);
      url.searchParams.set('code_challenge_method', 'S256');
    }
    for (const [k, v] of Object.entries(this.spec.extraAuthorizeParams ?? {}))
      url.searchParams.set(k, v);
    return url.toString();
  }

  async exchange(input: OAuthExchangeInput): Promise<OAuthTokens> {
    const ctx = await this.context();
    const res = await ctx.fetch(ctx.endpoints.tokenUrl, {
      method: 'POST',
      headers: tokenHeaders(this.spec.tokenAuth, ctx.client),
      body: form({
        grant_type: 'authorization_code',
        code: input.code,
        redirect_uri: input.redirectUri,
        [this.spec.clientIdParam]: ctx.client.clientId,
        ...(this.spec.tokenAuth === 'form' ? { client_secret: ctx.client.clientSecret } : {}),
        ...(input.codeVerifier ? { code_verifier: input.codeVerifier } : {}),
      }),
    });
    return this.spec.parseTokens(await jsonOrThrow(this.platform, res), ctx);
  }

  async whoAmI(accessToken: string): Promise<ConnectedAccount> {
    return this.spec.whoAmI(accessToken, await this.context());
  }

  async refresh(refreshToken: string): Promise<OAuthTokens> {
    if (!this.spec.refresh) throw new Error(`${this.platform} does not support refresh`);
    return this.spec.refresh(refreshToken, await this.context());
  }

  /** Reads endpoints (config) and the app's client credentials (env) fresh for each call. */
  async endpoints(): Promise<OAuthEndpoints> {
    return this.deps.config.get('platform.oauth', (raw) => OAuthEndpointsSchema.parse(raw), {
      platform: this.platform,
    });
  }

  isConfigured(): boolean {
    return Boolean(
      this.deps.env[this.spec.env.clientId] && this.deps.env[this.spec.env.clientSecret],
    );
  }

  private async context(): Promise<TokenContext> {
    const clientId = this.deps.env[this.spec.env.clientId];
    const clientSecret = this.deps.env[this.spec.env.clientSecret];
    if (!clientId || !clientSecret) {
      throw new ProviderNotConfiguredError(this.platform, [
        this.spec.env.clientId,
        this.spec.env.clientSecret,
      ]);
    }
    return {
      endpoints: await this.endpoints(),
      client: { clientId, clientSecret },
      fetch: this.deps.fetch,
      now: this.deps.now,
    };
  }
}
