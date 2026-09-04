import { type ConfigStale, fixedClock, type PolicyEntry } from '@heliograph/domain';
import { describe, expect, it } from 'vitest';
import { ConfigService } from './config.service.js';
import { StalenessWatcher } from './staleness-watcher.js';

const now = new Date('2026-09-03T12:00:00Z');
const days = (n: number) => new Date(now.getTime() - n * 86_400_000);
const entry = (key: string, verifiedAt: Date, maxAgeDays = 30): PolicyEntry => ({
  id: `id-${key}`,
  key,
  scope: 'global',
  scopeId: null,
  value: 1,
  version: 1,
  effectiveFrom: days(400),
  verifiedAt,
  verifiedBy: 'seed',
  sourceUrl: null,
  maxAgeDays,
  notes: null,
});

describe('StalenessWatcher', () => {
  it('emits one ConfigStale per overdue entry with warning/critical levels and skips fresh ones', async () => {
    const entries = [
      entry('a.fresh', days(1)),
      entry('b.warning', days(40)),
      entry('c.critical', days(70)),
    ];
    const repo = {
      findByKey: async (k: string) => entries.filter((e) => e.key === k),
      listEffective: async () => entries,
      save: async () => undefined,
    };
    const received: ConfigStale[] = [];
    const watcher = new StalenessWatcher(
      new ConfigService(repo, fixedClock(now)),
      { notify: async (e) => void received.push(e) },
      fixedClock(now),
    );
    const events = await watcher.run();
    expect(events).toEqual(received);
    // report is ordered most-overdue first
    expect(events.map((e) => [e.key, e.level, e.overdueDays])).toEqual([
      ['c.critical', 'critical', 40],
      ['b.warning', 'warning', 10],
    ]);
    expect(events[0]?.at).toEqual(now);
  });
});
