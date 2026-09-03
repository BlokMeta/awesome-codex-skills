/**
 * Ports injected into domain services so that time and randomness are deterministic in tests
 * (docs/03 §5, §11).
 */
export interface Clock {
  now(): Date;
}

export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number;
}

export const systemClock: Clock = { now: () => new Date() };

export const fixedClock = (at: Date): Clock => ({ now: () => new Date(at.getTime()) });

/** Deterministic mulberry32 generator for tests. */
export const seededRng = (seed: number): Rng => {
  let a = seed >>> 0;
  return {
    next() {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
};
