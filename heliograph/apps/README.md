# apps/

Uygulamalar burada: `web` (Next.js), `mobile` (Expo), `api` (NestJS), `workers` (Temporal). Bkz. `../docs/12-teknik-yol-haritasi.md`.

`api` (NestJS 12 + oRPC) hazır: `pnpm --filter @heliograph/api dev` → `GET /v1/health`, `GET /v1/health/config`. Modül düzeni docs/01 §5 (domain/application/infrastructure/interface); DI yalnızca sembol token'larla (`src/shared/tokens.ts`) — esbuild dekoratör meta verisi üretmediği için sınıf tipine göre enjeksiyon yapılmaz.
