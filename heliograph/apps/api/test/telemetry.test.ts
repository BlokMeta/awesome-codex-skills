import 'reflect-metadata';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { InMemoryMetricExporter, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/bootstrap.js';
import type { DatabaseHandle } from '../src/db/client.js';
import { StalenessWatcher } from '../src/modules/config/application/staleness-watcher.js';
import { DrizzlePolicyRepository } from '../src/modules/config/infrastructure/drizzle-policy.repository.js';
import { seedEntries } from '../src/modules/config/infrastructure/seed.js';
import { DrizzleMembershipRepository } from '../src/modules/identity/infrastructure/drizzle-membership.repository.js';
import { readTelemetryOptions, startTelemetry, type Telemetry } from '../src/telemetry.js';
import { testIdentityOptions } from './support/auth.js';
import { testChannelOptions } from './support/channel.js';
import { createTestDatabase } from './support/db.js';

const spans = new InMemorySpanExporter();
const metricsExporter = new InMemoryMetricExporter(0);
const metricReader = new PeriodicExportingMetricReader({
  exporter: metricsExporter,
  exportIntervalMillis: 60_000,
});
let telemetry: Telemetry;
let app: NestFastifyApplication;
let handle: DatabaseHandle;

beforeAll(async () => {
  telemetry = startTelemetry({ spanProcessors: [new SimpleSpanProcessor(spans)], metricReader });
  handle = await createTestDatabase();
  await new DrizzlePolicyRepository(handle.db).seedIfMissing(seedEntries(new Date()));
  app = await createApp({
    db: handle.db,
    identity: testIdentityOptions(),
    channel: testChannelOptions(),
    fastifyOtelPlugin: telemetry.fastifyPlugin,
  });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});

afterAll(async () => {
  await app.close();
  await handle.close();
  await telemetry.shutdown();
});

describe('telemetry', () => {
  it('is off without an endpoint or injected exporters', async () => {
    const off = startTelemetry(readTelemetryOptions({}));
    expect(off.enabled).toBe(false);
    expect(off.fastifyPlugin).toBeNull();
    await expect(off.shutdown()).resolves.toBeUndefined();
  });

  it('reads endpoint, headers and version from the environment', () => {
    expect(
      readTelemetryOptions({
        HG_OTEL_EXPORTER_OTLP_ENDPOINT: 'http://otel:4318',
        HG_OTEL_EXPORTER_OTLP_HEADERS: 'Authorization=Basic abc',
        HG_VERSION: '1.2.3',
      }),
    ).toEqual({
      endpoint: 'http://otel:4318',
      headers: 'Authorization=Basic abc',
      serviceVersion: '1.2.3',
    });
  });

  it('produces a request span per HTTP call and db.transaction spans with tenant attributes', async () => {
    spans.reset();
    const res = await app
      .getHttpAdapter()
      .getInstance()
      .inject({ method: 'GET', url: '/v1/health' });
    expect(res.statusCode).toBe(200);
    await new DrizzleMembershipRepository(handle.db).listForWorkspace('ws_trace');
    await new DrizzleMembershipRepository(handle.db).listForOperator('op_trace');
    const finished = spans.getFinishedSpans();
    expect(finished.some((s) => s.name.includes('GET') || s.name.includes('request'))).toBe(true);
    const tenantSpans = finished.filter((s) => s.name === 'db.transaction');
    expect(tenantSpans.map((s) => s.attributes['hg.tenant_scope'])).toEqual(
      expect.arrayContaining(['workspace', 'none']),
    );
    expect(tenantSpans.find((s) => s.attributes['hg.workspace_id'] === 'ws_trace')).toBeDefined();
    expect(
      tenantSpans.find(
        (s) => s.attributes['hg.reason'] === 'login: list workspaces of the operator',
      ),
    ).toBeDefined();
  });

  it('exports the hg_config_stale_keys gauge after the watcher runs', async () => {
    const watcher = app.get(StalenessWatcher);
    await watcher.run();
    await metricReader.forceFlush();
    const metric = metricsExporter
      .getMetrics()
      .flatMap((r) => r.scopeMetrics)
      .flatMap((s) => s.metrics)
      .find((m) => m.descriptor.name === 'hg_config_stale_keys');
    expect(metric).toBeDefined();
    expect(metric?.dataPoints.map((d) => d.attributes['level']).sort()).toEqual([
      'critical',
      'warning',
    ]);
  });
});
