import fastifyOtelPkg from '@fastify/otel';
import { DiagConsoleLogger, DiagLogLevel, diag, metrics, trace } from '@opentelemetry/api';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici';
import { defaultResource, resourceFromAttributes } from '@opentelemetry/resources';
import type { IMetricReader } from '@opentelemetry/sdk-metrics';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import type { SpanExporter, SpanProcessor } from '@opentelemetry/sdk-trace-base';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import type { FastifyPluginCallback } from 'fastify';

const TRACER_NAME = 'heliograph-api';
const METER_NAME = 'heliograph';

interface TelemetryOptions {
  /** OTLP/HTTP base endpoint (…:4318). Absent → telemetry stays off. */
  readonly endpoint?: string | undefined;
  /** "k=v,k2=v2" as in OTEL_EXPORTER_OTLP_HEADERS. */
  readonly headers?: string | undefined;
  readonly serviceVersion?: string | undefined;
  /** Test seams: replace the OTLP exporters / processors. */
  readonly traceExporter?: SpanExporter | undefined;
  readonly spanProcessors?: SpanProcessor[] | undefined;
  readonly metricReader?: IMetricReader | undefined;
}

export interface Telemetry {
  readonly enabled: boolean;
  /** Registered on the Fastify instance by bootstrap; creates the server span per request. */
  readonly fastifyPlugin: FastifyPluginCallback | null;
  shutdown(): Promise<void>;
}

const DISABLED: Telemetry = {
  enabled: false,
  fastifyPlugin: null,
  shutdown: async () => undefined,
};

function parseHeaders(raw: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of (raw ?? '').split(',')) {
    const i = pair.indexOf('=');
    if (i > 0) out[pair.slice(0, i).trim()] = pair.slice(i + 1).trim();
  }
  return out;
}

/**
 * OpenTelemetry bootstrap (docs/09 §1). Traces: Fastify request spans (@fastify/otel, no module
 * loader hooks needed under ESM), outbound fetch/undici spans, and manual `db.transaction` spans
 * from src/db/tenant.ts. Metrics: OTLP push; business meters use `meter()` below with `hg_` names.
 * pino log lines carry traceId/spanId through the mixin in app.module.ts.
 */
export function startTelemetry(opts: TelemetryOptions): Telemetry {
  if (!opts.endpoint && !opts.traceExporter && !opts.spanProcessors && !opts.metricReader) {
    return DISABLED;
  }
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);
  const headers = parseHeaders(opts.headers);
  const base = opts.endpoint?.replace(/\/$/, '');
  const traceExporter =
    opts.traceExporter ??
    (opts.spanProcessors
      ? undefined
      : new OTLPTraceExporter({ url: `${base}/v1/traces`, headers }));
  const metricReader =
    opts.metricReader ??
    new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({ url: `${base}/v1/metrics`, headers }),
      exportIntervalMillis: 30_000,
    });
  const fastifyOtel = new fastifyOtelPkg.FastifyOtelInstrumentation();
  const sdk = new NodeSDK({
    resource: defaultResource().merge(
      resourceFromAttributes({
        [ATTR_SERVICE_NAME]: TRACER_NAME,
        [ATTR_SERVICE_VERSION]: opts.serviceVersion ?? '0.0.0',
      }),
    ),
    ...(traceExporter ? { traceExporter } : {}),
    ...(opts.spanProcessors ? { spanProcessors: opts.spanProcessors } : {}),
    metricReaders: [metricReader],
    instrumentations: [new UndiciInstrumentation(), fastifyOtel],
  });
  sdk.start();
  return {
    enabled: true,
    fastifyPlugin: fastifyOtel.plugin(),
    shutdown: () => sdk.shutdown(),
  };
}

export function readTelemetryOptions(env: NodeJS.ProcessEnv = process.env): TelemetryOptions {
  return {
    endpoint: env['HG_OTEL_EXPORTER_OTLP_ENDPOINT'] || undefined,
    headers: env['HG_OTEL_EXPORTER_OTLP_HEADERS'] || undefined,
    serviceVersion: env['HG_VERSION'] || undefined,
  };
}

export const tracer = () => trace.getTracer(TRACER_NAME);
export const meter = () => metrics.getMeter(METER_NAME);
