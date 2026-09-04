import type { Clock, ConfigReader } from '@heliograph/domain';
import { type DynamicModule, Module } from '@nestjs/common';
import { z } from 'zod';
import type { Database } from '../../db/client.js';
import {
  BOT_TOKEN_PROVIDER,
  CHANNEL_REPOSITORY,
  CLOCK,
  CONFIG_READER,
  CREDENTIAL_STORE,
  DATABASE,
  KEY_WRAPPER,
  OAUTH_PROVIDERS,
  OAUTH_STATE_REPOSITORY,
} from '../../shared/tokens.js';
import { BillingModule } from '../billing/billing.module.js';
import { ConfigModule } from '../config/config.module.js';
import { PersonaModule } from '../persona/persona.module.js';
import {
  CHANNEL_URLS,
  ChannelService,
  type OAuthProviders,
} from './application/channel.service.js';
import { DrizzleChannelRepository } from './infrastructure/drizzle-channel.repository.js';
import { DrizzleCredentialStore } from './infrastructure/drizzle-credential.store.js';
import { DrizzleOAuthStateRepository } from './infrastructure/drizzle-oauth-state.repository.js';
import { type KeyWrapper, MasterKeyWrapper } from './infrastructure/envelope.js';
import type { HttpFetch } from './infrastructure/oauth/http.js';
import { OAuth2Provider, PLATFORM_SPECS } from './infrastructure/oauth/oauth2.provider.js';
import { TelegramBotProvider } from './infrastructure/oauth/telegram.provider.js';
import { ChannelController, WEB_URL } from './interface/channel.controller.js';

export interface ChannelModuleOptions {
  /** Defaults to `HG_PUBLIC_API_URL` / `HG_PUBLIC_WEB_URL`. */
  readonly urls?: { apiUrl: string; webUrl: string };
  /** Defaults to `HG_ENCRYPTION_MASTER_KEY`. */
  readonly keyWrapper?: KeyWrapper;
  /** Outbound HTTP for provider calls; tests inject a fake. */
  readonly fetch?: HttpFetch;
  /** Where client ids/secrets are read from (`HG_META_APP_ID`, …). */
  readonly env?: NodeJS.ProcessEnv;
}

/** Same variables auth validates (docs/14 A1); AppModule normally passes them through. */
const urlsFromEnv = (env: NodeJS.ProcessEnv) =>
  z
    .object({ HG_PUBLIC_API_URL: z.string().url(), HG_PUBLIC_WEB_URL: z.string().url() })
    .transform((e) => ({ apiUrl: e.HG_PUBLIC_API_URL, webUrl: e.HG_PUBLIC_WEB_URL }))
    .parse(env);

const masterKeyFromEnv = (): KeyWrapper => {
  const key = process.env['HG_ENCRYPTION_MASTER_KEY'];
  if (!key) throw new Error('HG_ENCRYPTION_MASTER_KEY is required (docs/14 A1)');
  return new MasterKeyWrapper(key);
};

@Module({})
export class ChannelModule {
  static forRoot(opts: ChannelModuleOptions = {}): DynamicModule {
    const env = opts.env ?? process.env;
    const fetchImpl: HttpFetch = opts.fetch ?? ((input, init) => fetch(input, init));
    const urls = opts.urls ?? urlsFromEnv(env);
    return {
      module: ChannelModule,
      imports: [ConfigModule, BillingModule, PersonaModule],
      controllers: [ChannelController],
      providers: [
        { provide: KEY_WRAPPER, useFactory: () => opts.keyWrapper ?? masterKeyFromEnv() },
        { provide: CHANNEL_URLS, useValue: { apiUrl: urls.apiUrl } },
        { provide: WEB_URL, useValue: urls.webUrl },
        {
          provide: CHANNEL_REPOSITORY,
          useFactory: (db: Database) => new DrizzleChannelRepository(db),
          inject: [DATABASE],
        },
        {
          provide: CREDENTIAL_STORE,
          useFactory: (db: Database, wrapper: KeyWrapper) =>
            new DrizzleCredentialStore(db, wrapper),
          inject: [DATABASE, KEY_WRAPPER],
        },
        {
          provide: OAUTH_STATE_REPOSITORY,
          useFactory: (db: Database) => new DrizzleOAuthStateRepository(db),
          inject: [DATABASE],
        },
        {
          provide: OAUTH_PROVIDERS,
          useFactory: (config: ConfigReader, clock: Clock): OAuthProviders =>
            new Map(
              Object.values(PLATFORM_SPECS).map((spec) => [
                spec.platform,
                new OAuth2Provider(spec, { config, fetch: fetchImpl, env, now: () => clock.now() }),
              ]),
            ),
          inject: [CONFIG_READER, CLOCK],
        },
        {
          provide: BOT_TOKEN_PROVIDER,
          useFactory: (config: ConfigReader) => new TelegramBotProvider(config, fetchImpl),
          inject: [CONFIG_READER],
        },
        ChannelService,
      ],
      exports: [ChannelService, CREDENTIAL_STORE, CHANNEL_REPOSITORY],
    };
  }
}
