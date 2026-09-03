import { z } from 'zod';
import type { Rng } from '../shared/ports.js';

const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;

export const PostingWindowSchema = z
  .object({
    /** ISO weekday numbers, 1 = Monday … 7 = Sunday */
    days: z.array(z.number().int().min(1).max(7)).min(1),
    from: z.string().regex(timeRe),
    to: z.string().regex(timeRe),
  })
  .refine((w) => w.from < w.to, { message: 'window.from must be before window.to' });

export const PostingPolicySchema = z.object({
  dailyPosts: z.object({ min: z.number().int().min(0), max: z.number().int().min(0) }),
  dailyVideos: z.object({ min: z.number().int().min(0), max: z.number().int().min(0) }),
  windows: z.array(PostingWindowSchema).min(1),
  jitterMinutes: z.number().int().min(0).max(120).default(22),
  weekendFactor: z.number().min(0).max(1).default(0.6),
});

export type PostingPolicy = z.infer<typeof PostingPolicySchema>;
export type PostingWindow = z.infer<typeof PostingWindowSchema>;

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

/**
 * Spread `count` slots across the day's windows, evenly, then apply ±jitter.
 * Pure: same inputs + same rng → same output. Returns minutes from local midnight, sorted.
 */
export function planDailySlots(
  policy: PostingPolicy,
  isoWeekday: number,
  count: number,
  rng: Rng,
): number[] {
  const windows = policy.windows.filter((w) => w.days.includes(isoWeekday));
  if (count <= 0 || windows.length === 0) return [];

  const spans = windows.map((w) => ({ start: toMinutes(w.from), end: toMinutes(w.to) }));
  const total = spans.reduce((acc, s) => acc + (s.end - s.start), 0);
  if (total <= 0) return [];

  const slots: number[] = [];
  for (let i = 0; i < count; i++) {
    // position in [0, total) at the centre of the i-th equal segment
    let offset = ((i + 0.5) / count) * total;
    for (const span of spans) {
      const len = span.end - span.start;
      if (offset < len) {
        const jitter = (rng.next() * 2 - 1) * policy.jitterMinutes;
        const minute = Math.round(span.start + offset + jitter);
        slots.push(Math.min(Math.max(minute, span.start), span.end - 1));
        break;
      }
      offset -= len;
    }
  }
  return slots.sort((a, b) => a - b);
}

/** How many posts a persona should make on a given weekday, honouring the weekend factor. */
export function targetCountFor(
  range: { min: number; max: number },
  isoWeekday: number,
  weekendFactor: number,
): number {
  const isWeekend = isoWeekday >= 6;
  const base = isWeekend ? Math.round(range.max * weekendFactor) : range.max;
  return Math.max(range.min, Math.min(base, range.max));
}
