import { z } from 'zod';

/** RFC 9457 Problem Details with Heliograph extensions (docs/05 §3). */
export const ProblemFieldErrorSchema = z.object({
  path: z.string(),
  code: z.string(),
  messageId: z.string(),
  params: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

export const ProblemSchema = z.object({
  type: z.string().url(),
  title: z.string(),
  status: z.number().int().min(400).max(599),
  detail: z.string().optional(),
  instance: z.string().optional(),
  code: z.string(),
  messageId: z.string(),
  params: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
  requestId: z.string(),
  errors: z.array(ProblemFieldErrorSchema).optional(),
});
export type Problem = z.infer<typeof ProblemSchema>;

export const PROBLEM_BASE_URL = 'https://heliograph.app/problems/';

export const problemType = (slug: string): string => `${PROBLEM_BASE_URL}${slug}`;
