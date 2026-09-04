import type { BotTokenProvider, ConfigReader, ConnectedAccount } from '@heliograph/domain';
import { z } from 'zod';
import { type HttpFetch, jsonOrThrow } from './http.js';

const TelegramConfigSchema = z.object({ apiBase: z.string().url() });

const GetMeSchema = z.object({
  ok: z.literal(true),
  result: z.object({
    id: z.number(),
    is_bot: z.literal(true),
    first_name: z.string(),
    username: z.string().optional(),
  }),
});

/** Telegram bots authenticate with a token from @BotFather; `getMe` proves it and names the bot. */
export class TelegramBotProvider implements BotTokenProvider {
  readonly platform = 'telegram' as const;

  constructor(
    private readonly config: ConfigReader,
    private readonly fetch: HttpFetch,
  ) {}

  async validate(botToken: string): Promise<ConnectedAccount> {
    if (!/^\d{5,}:[A-Za-z0-9_-]{20,}$/.test(botToken)) {
      throw new Error('telegram: malformed bot token');
    }
    const { apiBase } = await this.config.get(
      'platform.oauth',
      (raw) => TelegramConfigSchema.parse(raw),
      { platform: 'telegram' },
    );
    const res = await this.fetch(`${apiBase}/bot${botToken}/getMe`, {
      headers: { accept: 'application/json' },
    });
    const me = GetMeSchema.parse(await jsonOrThrow('telegram', res));
    return {
      externalAccountId: String(me.result.id),
      handle: me.result.username ?? String(me.result.id),
      displayName: me.result.first_name,
    };
  }
}
