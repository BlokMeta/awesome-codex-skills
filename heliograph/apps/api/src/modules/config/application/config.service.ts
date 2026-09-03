import {
  type Clock,
  type ConfigReader,
  type PolicyRepository,
  resolveWithFallback,
  type Staleness,
  stalenessReport,
} from '@heliograph/domain';
import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, POLICY_REPOSITORY } from '../../../shared/tokens.js';

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

/**
 * ConfigReader with a mandatory TTL cache (ADR-0011 §5). `invalidate()` is called by the
 * ConfigChanged handler; nothing lives in the cache longer than `ttlMs`.
 */
@Injectable()
export class ConfigService implements ConfigReader {
  private readonly cache = new Map<string, CacheEntry>();

  constructor(
    @Inject(POLICY_REPOSITORY) private readonly repo: PolicyRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly ttlMs = 60_000,
  ) {}

  async get<T>(
    key: string,
    parse: (raw: unknown) => T,
    ctx: { workspaceId?: string; platform?: string } = {},
  ): Promise<T> {
    const cacheKey = `${key}|${ctx.workspaceId ?? ''}|${ctx.platform ?? ''}`;
    const now = this.clock.now();
    const hit = this.cache.get(cacheKey);
    if (hit && hit.expiresAt > now.getTime()) return parse(hit.value);

    const entries = await this.repo.findByKey(key);
    const effective = resolveWithFallback(entries, key, now, ctx);
    if (!effective) throw new Error(`config key missing: ${key}`);
    this.cache.set(cacheKey, { value: effective.value, expiresAt: now.getTime() + this.ttlMs });
    return parse(effective.value);
  }

  invalidate(key?: string): void {
    if (!key) {
      this.cache.clear();
      return;
    }
    for (const k of this.cache.keys()) if (k.startsWith(`${key}|`)) this.cache.delete(k);
  }

  async staleness(): Promise<Staleness[]> {
    return stalenessReport(await this.repo.listEffective(), this.clock.now());
  }
}
