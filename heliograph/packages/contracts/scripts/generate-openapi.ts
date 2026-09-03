/**
 * `pnpm --filter @heliograph/contracts gen` — writes openapi.json deterministically
 * (sorted keys, no timestamps) so CI can assert the committed file is current.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { OpenAPIGenerator } from '@orpc/openapi';
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';
import { contract } from '../src/index.js';

const generator = new OpenAPIGenerator({
  schemaConverters: [new ZodToJsonSchemaConverter()],
});

const spec = await generator.generate(contract, {
  info: { title: 'Heliograph API', version: '1.0.0' },
  servers: [{ url: '/' }],
});

const sortKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, sortKeys(v)]),
    );
  }
  return value;
};

const out = resolve(import.meta.dirname, '..', 'openapi.json');
writeFileSync(out, `${JSON.stringify(sortKeys(spec), null, 2)}\n`);
process.stdout.write(`wrote ${out}\n`);
