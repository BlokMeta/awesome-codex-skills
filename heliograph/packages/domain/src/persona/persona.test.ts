import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { fixedClock, seededRng } from '../shared/ports.js';
import {
  activate,
  canTransition,
  type Persona,
  pause,
  volumeFactor,
  WARMUP_DAYS,
} from './persona.js';
import { type PostingPolicy, planDailySlots, targetCountFor } from './posting-policy.js';

const policy: PostingPolicy = {
  dailyPosts: { min: 3, max: 5 },
  dailyVideos: { min: 1, max: 2 },
  windows: [
    { days: [1, 2, 3, 4, 5], from: '09:00', to: '12:00' },
    { days: [1, 2, 3, 4, 5, 6, 7], from: '18:00', to: '22:00' },
  ],
  jitterMinutes: 22,
  weekendFactor: 0.6,
};

const aPersona = (overrides: Partial<Persona> = {}): Persona => ({
  id: '01J8Z3M9K2Q4R5S6T7V8W9X0Y1',
  workspaceId: '01J8Z3M9K2Q4R5S6T7V8W9X0Y2',
  slug: 'deniz',
  name: 'Deniz | Platform Engineer',
  niche: 'devops',
  language: 'tr',
  timezone: 'Europe/Istanbul',
  postingPolicy: policy,
  status: 'draft',
  warmupStartedAt: null,
  ...overrides,
});

describe('Persona lifecycle', () => {
  it('moves a draft persona into warming when started', () => {
    const clock = fixedClock(new Date('2026-09-03T10:00:00Z'));
    const result = activate(aPersona(), clock);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('warming');
      expect(result.value.warmupStartedAt?.toISOString()).toBe('2026-09-03T10:00:00.000Z');
    }
  });

  it('resumes a paused persona directly into active without restarting warm-up', () => {
    const started = new Date('2026-08-01T00:00:00Z');
    const result = activate(
      aPersona({ status: 'paused', warmupStartedAt: started }),
      fixedClock(new Date()),
    );
    expect(result.ok && result.value.status).toBe('active');
    expect(result.ok && result.value.warmupStartedAt).toBe(started);
  });

  it('rejects starting an archived persona with an i18n-addressable error', () => {
    const result = activate(aPersona({ status: 'archived' }), fixedClock(new Date()));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('persona.invalid_transition');
      expect(result.error.messageId).toBe('errors.persona.invalidTransition');
      expect(result.error.params).toEqual({ from: 'archived', to: 'active' });
    }
  });

  it('can pause only from warming or active', () => {
    expect(pause(aPersona({ status: 'active' })).ok).toBe(true);
    expect(pause(aPersona({ status: 'draft' })).ok).toBe(false);
    expect(canTransition('archived', 'active')).toBe(false);
  });

  it('ramps volume from 1/7 on day one to 1 after the warm-up period', () => {
    const started = new Date('2026-09-01T00:00:00Z');
    const persona = aPersona({ status: 'warming', warmupStartedAt: started });
    expect(volumeFactor(persona, fixedClock(new Date('2026-09-01T12:00:00Z')))).toBeCloseTo(
      1 / WARMUP_DAYS,
    );
    expect(volumeFactor(persona, fixedClock(new Date('2026-09-04T00:00:00Z')))).toBeCloseTo(
      4 / WARMUP_DAYS,
    );
    expect(volumeFactor(persona, fixedClock(new Date('2026-09-20T00:00:00Z')))).toBe(1);
    expect(volumeFactor(aPersona({ status: 'paused' }), fixedClock(new Date()))).toBe(0);
  });
});

describe('planDailySlots', () => {
  it('places every slot inside a window for that weekday and keeps them sorted', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 7 }),
        fc.integer({ min: 0, max: 12 }),
        fc.integer(),
        (day, count, seed) => {
          const slots = planDailySlots(policy, day, count, seededRng(seed));
          expect(slots).toHaveLength(count);
          const windows = policy.windows.filter((w) => w.days.includes(day));
          for (const minute of slots) {
            const inside = windows.some((w) => {
              const [fh, fm] = w.from.split(':').map(Number);
              const [th, tm] = w.to.split(':').map(Number);
              return minute >= (fh ?? 0) * 60 + (fm ?? 0) && minute < (th ?? 0) * 60 + (tm ?? 0);
            });
            expect(inside).toBe(true);
          }
          expect([...slots].sort((a, b) => a - b)).toEqual(slots);
        },
      ),
    );
  });

  it('is deterministic for the same seed', () => {
    const a = planDailySlots(policy, 3, 5, seededRng(42));
    const b = planDailySlots(policy, 3, 5, seededRng(42));
    expect(a).toEqual(b);
  });

  it('returns nothing when no window matches the weekday', () => {
    const weekdayOnly: PostingPolicy = {
      ...policy,
      windows: [policy.windows[0] as PostingPolicy['windows'][number]],
    };
    expect(planDailySlots(weekdayOnly, 7, 3, seededRng(1))).toEqual([]);
  });
});

describe('targetCountFor', () => {
  it('uses the maximum on weekdays and the weekend factor on weekends, never below min', () => {
    expect(targetCountFor({ min: 3, max: 5 }, 2, 0.6)).toBe(5);
    expect(targetCountFor({ min: 3, max: 5 }, 6, 0.6)).toBe(3);
    expect(targetCountFor({ min: 0, max: 2 }, 7, 0.6)).toBe(1);
  });
});
