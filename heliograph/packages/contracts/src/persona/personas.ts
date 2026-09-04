import {
  EngagementPolicySchema,
  PersonaNicheSchema,
  PersonaStatusSchema,
  PostingPolicySchema,
  QualityPolicySchema,
  TopicProfileSchema,
  VisualKitSchema,
  VoiceBibleSchema,
} from '@heliograph/domain';
import { oc } from '@orpc/contract';
import { z } from 'zod';
import { PageQuerySchema, pageOf } from '../common/pagination.js';

const SlugSchema = z
  .string()
  .min(2)
  .max(40)
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/);

export const PersonaDtoSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  slug: SlugSchema,
  name: z.string().min(1).max(80),
  niche: PersonaNicheSchema,
  language: z.string(),
  timezone: z.string(),
  status: PersonaStatusSchema,
  warmupStartedAt: z.string().datetime().nullable(),
  postingPolicy: PostingPolicySchema,
  voiceBible: VoiceBibleSchema,
  visualKit: VisualKitSchema,
  topicProfile: TopicProfileSchema,
  engagementPolicy: EngagementPolicySchema,
  qualityPolicy: QualityPolicySchema,
  /** Fields the wizard still needs before "Start" is allowed (empty = ready). */
  missingForStart: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type PersonaDto = z.infer<typeof PersonaDtoSchema>;

export const CreatePersonaSchema = z.object({
  name: z.string().min(1).max(80),
  /** Derived from the name when omitted. */
  slug: SlugSchema.optional(),
  niche: PersonaNicheSchema,
  language: z.string().min(2).max(35),
  timezone: z.string().min(1),
});

export const UpdatePersonaSchema = z
  .object({
    name: z.string().min(1).max(80),
    niche: PersonaNicheSchema,
    language: z.string().min(2).max(35),
    timezone: z.string().min(1),
    postingPolicy: PostingPolicySchema,
    voiceBible: VoiceBibleSchema,
    visualKit: VisualKitSchema,
    topicProfile: TopicProfileSchema,
    engagementPolicy: EngagementPolicySchema,
    qualityPolicy: QualityPolicySchema,
  })
  .partial()
  .extend({ reason: z.string().max(200).optional() });

const byId = z.object({ id: z.string().min(1) });

export const listPersonasContract = oc
  .route({
    method: 'GET',
    path: '/v1/personas',
    summary: 'Personas of the active workspace',
    tags: ['persona'],
  })
  .input(PageQuerySchema.extend({ status: PersonaStatusSchema.optional() }))
  .output(pageOf(PersonaDtoSchema));

export const createPersonaContract = oc
  .route({
    method: 'POST',
    path: '/v1/personas',
    summary: 'Create a draft persona (wizard step 1)',
    tags: ['persona'],
    successStatus: 201,
  })
  .input(CreatePersonaSchema)
  .output(PersonaDtoSchema);

export const getPersonaContract = oc
  .route({ method: 'GET', path: '/v1/personas/{id}', summary: 'Persona detail', tags: ['persona'] })
  .input(byId)
  .output(PersonaDtoSchema);

export const updatePersonaContract = oc
  .route({
    method: 'PATCH',
    path: '/v1/personas/{id}',
    summary: 'Update any wizard step; previous state is versioned',
    tags: ['persona'],
  })
  .input(byId.merge(UpdatePersonaSchema))
  .output(PersonaDtoSchema);

export const activatePersonaContract = oc
  .route({
    method: 'POST',
    path: '/v1/personas/{id}/activate',
    summary: 'Start (draft → warming) or resume (paused → active)',
    tags: ['persona'],
  })
  .input(byId)
  .output(PersonaDtoSchema);

export const pausePersonaContract = oc
  .route({
    method: 'POST',
    path: '/v1/personas/{id}/pause',
    summary: 'Pause publishing and engagement',
    tags: ['persona'],
  })
  .input(byId)
  .output(PersonaDtoSchema);

export const archivePersonaContract = oc
  .route({
    method: 'POST',
    path: '/v1/personas/{id}/archive',
    summary: 'Archive (terminal)',
    tags: ['persona'],
  })
  .input(byId)
  .output(PersonaDtoSchema);
