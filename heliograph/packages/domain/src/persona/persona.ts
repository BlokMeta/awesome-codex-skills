import { z } from 'zod';
import { type DomainError, domainError } from '../shared/domain-error.js';
import { IdSchema } from '../shared/id.js';
import type { Clock } from '../shared/ports.js';
import { err, ok, type Result } from '../shared/result.js';
import { type PostingPolicy, PostingPolicySchema } from './posting-policy.js';
import {
  DEFAULT_ENGAGEMENT_POLICY,
  DEFAULT_QUALITY_POLICY,
  DEFAULT_TOPIC_PROFILE,
  DEFAULT_VISUAL_KIT,
  DEFAULT_VOICE_BIBLE,
  EngagementPolicySchema,
  QualityPolicySchema,
  TopicProfileSchema,
  VisualKitSchema,
  VoiceBibleSchema,
} from './profile.js';

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
  voiceBible: VoiceBibleSchema,
  visualKit: VisualKitSchema,
  topicProfile: TopicProfileSchema,
  engagementPolicy: EngagementPolicySchema,
  qualityPolicy: QualityPolicySchema,
  status: PersonaStatusSchema,
  warmupStartedAt: z.date().nullable(),
});
export type Persona = z.infer<typeof PersonaSchema>;

export const PersonaNicheSchema = PersonaSchema.shape.niche;
export type PersonaNiche = z.infer<typeof PersonaNicheSchema>;

/** Conservative defaults for a brand-new persona (research §5: 5 posts + 2 videos at full volume). */
export const DEFAULT_POSTING_POLICY: PostingPolicy = {
  dailyPosts: { min: 3, max: 5 },
  dailyVideos: { min: 0, max: 2 },
  windows: [
    { days: [1, 2, 3, 4, 5], from: '09:00', to: '12:00' },
    { days: [1, 2, 3, 4, 5, 6, 7], from: '18:00', to: '22:00' },
  ],
  jitterMinutes: 22,
  weekendFactor: 0.6,
};

export interface NewPersonaInput {
  readonly id: string;
  readonly workspaceId: string;
  readonly slug: string;
  readonly name: string;
  readonly niche: PersonaNiche;
  readonly language: string;
  readonly timezone: string;
}

/** Step 1 of the wizard: a draft persona with every profile at its default. */
export function createDraft(input: NewPersonaInput): Result<Persona, DomainError> {
  const parsed = PersonaSchema.safeParse({
    ...input,
    postingPolicy: DEFAULT_POSTING_POLICY,
    voiceBible: DEFAULT_VOICE_BIBLE,
    visualKit: DEFAULT_VISUAL_KIT,
    topicProfile: DEFAULT_TOPIC_PROFILE,
    engagementPolicy: DEFAULT_ENGAGEMENT_POLICY,
    qualityPolicy: DEFAULT_QUALITY_POLICY,
    status: 'draft',
    warmupStartedAt: null,
  });
  if (!parsed.success) {
    return err(
      domainError('persona.invalid', 'errors.persona.invalid', {
        issue: parsed.error.issues[0]?.path.join('.') ?? 'unknown',
      }),
    );
  }
  return ok(parsed.data);
}

export function archive(persona: Persona): Result<Persona, DomainError> {
  if (!canTransition(persona.status, 'archived')) {
    return err(
      domainError('persona.invalid_transition', 'errors.persona.invalidTransition', {
        from: persona.status,
        to: 'archived',
      }),
    );
  }
  return ok({ ...persona, status: 'archived' });
}

/**
 * A persona may only be started once the operator has written a voice bible: without a summary
 * and at least one tone word every draft would sound like the model's default voice.
 */
export function readyToStart(persona: Persona): DomainError | null {
  const missing: string[] = [];
  if (persona.voiceBible.summary.trim().length < 40) missing.push('voiceBible.summary');
  if (persona.voiceBible.tone.length === 0) missing.push('voiceBible.tone');
  if (persona.topicProfile.include.length === 0) missing.push('topicProfile.include');
  return missing.length
    ? domainError('persona.incomplete', 'errors.persona.incomplete', { fields: missing.join(', ') })
    : null;
}

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
