import { LegalDocumentSchema, OPTIONAL_CONSENTS, VersionSchema } from '@heliograph/domain';
import { oc } from '@orpc/contract';
import { z } from 'zod';

const OptionalDocumentSchema = z.enum(
  OPTIONAL_CONSENTS as [LegalDocumentSchemaType, ...LegalDocumentSchemaType[]],
);
type LegalDocumentSchemaType = z.infer<typeof LegalDocumentSchema>;

export const ConsentStatusSchema = z.object({
  /** Required documents not yet accepted at their published version, in display order. */
  pending: z.array(LegalDocumentSchema),
  accepted: z.array(
    z.object({
      document: LegalDocumentSchema,
      version: VersionSchema,
      acceptedAt: z.string().datetime(),
    }),
  ),
  optional: z.record(OptionalDocumentSchema, z.enum(['granted', 'not_granted', 'outdated'])),
  /** Currently published version per document (from dynamic config). */
  published: z.partialRecord(LegalDocumentSchema, VersionSchema),
});
export type ConsentStatus = z.infer<typeof ConsentStatusSchema>;

export const AcceptConsentsSchema = z.object({
  accept: z
    .array(z.object({ document: LegalDocumentSchema, version: VersionSchema }))
    .min(1)
    .max(20),
});

export const consentStatusContract = oc
  .route({
    method: 'GET',
    path: '/v1/consents',
    summary: 'Legal documents accepted / pending for the current operator',
    tags: ['privacy'],
  })
  .output(ConsentStatusSchema);

export const acceptConsentsContract = oc
  .route({
    method: 'POST',
    path: '/v1/consents',
    summary: 'Record acceptance of legal documents at their published version',
    tags: ['privacy'],
  })
  .input(AcceptConsentsSchema)
  .output(ConsentStatusSchema);

export const withdrawConsentContract = oc
  .route({
    method: 'POST',
    path: '/v1/consents/withdraw',
    summary: 'Withdraw an optional consent (KVKK explicit consent, cookies)',
    tags: ['privacy'],
  })
  .input(z.object({ document: OptionalDocumentSchema }))
  .output(ConsentStatusSchema);
