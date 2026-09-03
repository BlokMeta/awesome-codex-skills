import { z } from 'zod';
import { type DomainError, domainError } from '../shared/domain-error.js';
import { IdSchema } from '../shared/id.js';
import type { Clock } from '../shared/ports.js';
import { err, ok, type Result } from '../shared/result.js';
import { PostingPolicySchema } from './posting-policy.js';

export const PersonaStatusSchema = z.enum(['draft', 'warming', 'active', 'paused', 'archived']);
export type PersonaStatus = z.infer<typeof PersonaStatusSchema>;

export const PersonaSchema = z.object({
  id: IdSchema,
  workspaceId: IdSchema,
  slug: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, 'slug must be kebab-case'),
  name: z.string().min(1).max(80),
  niche: z.enum(['devops', 'ai', 'both', 'personal']),
  language: z.string().min(2).max(35), // BCP-47
  timezone: z.string().min(1),
  postingPolicy: PostingPolicySchema,
  status: PersonaStatusSchema,
  warmupStartedAt: z.date().nullable(),
});
export type Persona = z.infer<typeof PersonaSchema>;

/** Warm-up lasts this many days; volume ramps up day by day (docs/… §8.2 of research). */
export const WARMUP_DAYS = 7;

const transitions: Record<PersonaStatus, readonly PersonaStatus[]> = {
  draft: ['warming', 'archived'],
  warming: ['active', 'paused', 'archived'],
  active: ['paused', 'archived'],
  paused: ['warming', 'active', 'archived'],
  archived: [],
};

export function canTransition(from: PersonaStatus, to: PersonaStatus): boolean {
  return transitions[from].includes(to);
}

/** "Start" button: a draft persona enters warming; a paused one resumes. */
export function activate(persona: Persona, clock: Clock): Result<Persona, DomainError> {
  if (persona.status === 'draft' || persona.status === 'paused') {
    const target: PersonaStatus = persona.status === 'draft' ? 'warming' : 'active';
    const warmupStartedAt = target === 'warming' ? clock.now() : persona.warmupStartedAt;
    return ok({ ...persona, status: target, warmupStartedAt });
  }
  return err(
    domainError('persona.invalid_transition', 'errors.persona.invalidTransition', {
      from: persona.status,
      to: 'active',
    }),
  );
}

export function pause(persona: Persona): Result<Persona, DomainError> {
  if (!canTransition(persona.status, 'paused')) {
    return err(
      domainError('persona.invalid_transition', 'errors.persona.invalidTransition', {
        from: persona.status,
        to: 'paused',
      }),
    );
  }
  return ok({ ...persona, status: 'paused' });
}

/**
 * Volume multiplier during warm-up: day 1 → 1/WARMUP_DAYS … day 7 → 1. Active → 1.
 * Not active/warming → 0.
 */
export function volumeFactor(persona: Persona, clock: Clock): number {
  if (persona.status === 'active') return 1;
  if (persona.status !== 'warming' || !persona.warmupStartedAt) return 0;
  const elapsedDays = Math.floor(
    (clock.now().getTime() - persona.warmupStartedAt.getTime()) / 86_400_000,
  );
  return Math.min(1, (elapsedDays + 1) / WARMUP_DAYS);
}
