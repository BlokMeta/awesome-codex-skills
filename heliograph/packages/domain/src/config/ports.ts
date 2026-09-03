import type { PolicyEntry, PolicyScope } from './policy-entry.js';

/** Persistence port for policy entries; implemented with Drizzle in apps/api. */
export interface PolicyRepository {
  findByKey(key: string): Promise<PolicyEntry[]>;
  listEffective(): Promise<PolicyEntry[]>;
  save(entry: PolicyEntry): Promise<void>;
}

/**
 * Read port used by every module that needs a "constant". Implementations cache with a TTL
 * and subscribe to ConfigChanged to invalidate — never a cache without expiry (CLAUDE.md rule 13).
 */
export interface ConfigReader {
  get<T>(
    key: string,
    parse: (raw: unknown) => T,
    ctx?: { workspaceId?: string; platform?: string },
  ): Promise<T>;
}

export interface ConfigChanged {
  readonly type: 'ConfigChanged';
  readonly key: string;
  readonly scope: PolicyScope;
  readonly scopeId: string | null;
  readonly version: number;
  readonly at: Date;
}

export interface ConfigStale {
  readonly type: 'ConfigStale';
  readonly key: string;
  readonly scope: PolicyScope;
  readonly scopeId: string | null;
  readonly overdueDays: number;
  readonly level: 'warning' | 'critical';
  readonly at: Date;
}
