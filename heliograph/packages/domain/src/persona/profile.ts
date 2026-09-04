import { z } from 'zod';

/**
 * The parts of a persona that make its content recognisably *one voice* (docs/01 §4 persona
 * context; research §5–6). All of it is JSON, edited from the wizard, versioned on change.
 */
export const VoiceBibleSchema = z.object({
  /** One paragraph the writer prompt opens with — who is speaking and why they post. */
  summary: z.string().max(1200).default(''),
  audience: z.string().max(400).default(''),
  tone: z.array(z.string().min(1).max(40)).max(8).default([]),
  register: z.enum(['casual', 'plain', 'professional', 'playful']).default('plain'),
  doList: z.array(z.string().min(1).max(200)).max(20).default([]),
  dontList: z.array(z.string().min(1).max(200)).max(20).default([]),
  /** Words and phrases the persona actually uses / never uses (K1 gate feeds on these). */
  preferredPhrases: z.array(z.string().min(1).max(80)).max(50).default([]),
  bannedPhrases: z.array(z.string().min(1).max(80)).max(100).default([]),
  /** Real, reusable anecdotes the persona may draw on — the "experience pool" against AI smell. */
  experiencePool: z.array(z.string().min(1).max(600)).max(40).default([]),
  samplePosts: z.array(z.string().min(1).max(2000)).max(12).default([]),
  emojiQuota: z
    .object({ min: z.number().int().min(0).max(10), max: z.number().int().min(0).max(10) })
    .default({ min: 0, max: 2 }),
  hashtagQuota: z
    .object({ min: z.number().int().min(0).max(30), max: z.number().int().min(0).max(30) })
    .default({ min: 0, max: 4 }),
  /** Punctuation habits normalised by the style gate (research §6.1 "tıkır tıkır noktalama"). */
  punctuation: z
    .object({
      emDash: z.enum(['never', 'rare', 'free']).default('rare'),
      exclamation: z.enum(['never', 'rare', 'free']).default('rare'),
      lowercaseStarts: z.boolean().default(false),
    })
    .default({ emDash: 'rare', exclamation: 'rare', lowercaseStarts: false }),
});
export type VoiceBible = z.infer<typeof VoiceBibleSchema>;

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

export const VisualKitSchema = z.object({
  palette: z
    .object({ primary: hex, accent: hex, ground: hex })
    .default({ primary: '#1F4E5A', accent: '#F2B705', ground: '#F4F5F1' }),
  fontFamily: z.enum(['display', 'body', 'mono']).default('body'),
  avatar: z
    .discriminatedUnion('kind', [
      z.object({ kind: z.literal('initials') }),
      z.object({ kind: z.literal('asset'), assetId: z.string().min(1) }),
    ])
    .default({ kind: 'initials' }),
  watermark: z.boolean().default(false),
});
export type VisualKit = z.infer<typeof VisualKitSchema>;

export const TopicProfileSchema = z.object({
  include: z.array(z.string().min(1).max(60)).max(40).default([]),
  exclude: z.array(z.string().min(1).max(60)).max(40).default([]),
  /** Source family weights used by trend scoring (0 = ignore, 1 = normal, 2 = favour). */
  sourceWeights: z.record(z.string(), z.number().min(0).max(2)).default({}),
  /** Signals older than this are not turned into briefs for this persona. */
  freshnessHours: z.number().int().min(1).max(168).default(36),
});
export type TopicProfile = z.infer<typeof TopicProfileSchema>;

export const EngagementPolicySchema = z.object({
  autoReply: z.boolean().default(false),
  /** Share of eligible comments/DMs that get a reply (research: human-like ratio, not 100%). */
  replyRatio: z.number().min(0).max(1).default(0.35),
  replyDelayMinutes: z
    .object({ min: z.number().int().min(0).max(1440), max: z.number().int().min(0).max(1440) })
    .default({ min: 8, max: 180 }),
  /** Platforms where replies are drafted for a human instead of sent (X policy default). */
  humanDraftPlatforms: z.array(z.string().min(1)).default(['x', 'tiktok']),
  quietHours: z.object({ from: z.string(), to: z.string() }).nullable().default(null),
});
export type EngagementPolicy = z.infer<typeof EngagementPolicySchema>;

export const QualityPolicySchema = z.object({
  humanReview: z
    .enum(['always', 'first_30_days', 'score_below_threshold', 'never'])
    .default('always'),
  minScore: z.number().min(0).max(10).default(7),
  maxRegenerations: z.number().int().min(0).max(5).default(2),
  aiDisclosure: z.enum(['auto', 'always']).default('auto'),
});
export type QualityPolicy = z.infer<typeof QualityPolicySchema>;

export const DEFAULT_VOICE_BIBLE: VoiceBible = VoiceBibleSchema.parse({});
export const DEFAULT_VISUAL_KIT: VisualKit = VisualKitSchema.parse({});
export const DEFAULT_TOPIC_PROFILE: TopicProfile = TopicProfileSchema.parse({});
export const DEFAULT_ENGAGEMENT_POLICY: EngagementPolicy = EngagementPolicySchema.parse({});
export const DEFAULT_QUALITY_POLICY: QualityPolicy = QualityPolicySchema.parse({});
