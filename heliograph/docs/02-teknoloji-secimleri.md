# 02 — Teknoloji Seçimleri (Eylül 2026)

Sürümler npm kayıt defterinden ve resmi sürüm notlarından alınmıştır (3 Eylül 2026). Her satırın gerekçesi kısa; ayrıntı ve alternatifler `adr/` altında. ⚠ = doğrulanamayan veya taze/hareketli madde.

## 1. Çekirdek

| Katman | Seçim | Sürüm | Neden | Reddedilen |
|---|---|---|---|---|
| Dil | TypeScript | 7.0 (Go tabanlı derleyici, stabil Tem 2026) | Tek dil, tek tip sistemi; monorepo genelinde | – |
| Çalışma zamanı | Node.js | 22 LTS | pnpm 11 ve NestJS 12 gereksinimi | Bun (ekosistem riski) |
| Paket yöneticisi | pnpm | 11.x | `catalog:` ile sürüm eşitleme, release-age guard (supply-chain), hızlı | npm, yarn |
| Monorepo | Turborepo | 2.10 | 3 uygulama + 6 paket için yeterli, basit, remote cache | Nx 23 (generators/DTE gerekirse ADR ile geçilir) |
| Lint/format | Biome + ESLint (yalnızca plugin kuralları) | 2.5 / 10.x | Biome format + çekirdek lint; ESLint sadece react-hooks, jsx-a11y, react-native, typescript-eslint tipli kurallar | oxlint (ikisinden biri; Biome seçildi) |
| Hijyen | knip, dependency-cruiser, syncpack | 6 / 18 / 15 | Ölü kod, sınır ihlali, sürüm uyumu | – |

## 2. Backend

| Katman | Seçim | Sürüm | Neden | Reddedilen |
|---|---|---|---|---|
| Uygulama çerçevesi | NestJS | 12 (ESM, Standard Schema, Vitest varsayılan) | Modüler monolit için DI + modül sınırları; olgun | Hono/Fastify tek başına (yapı disiplini yok); Fastify **adaptör** olarak kullanılır |
| HTTP adaptörü | @nestjs/platform-fastify | 5.x | Performans | Express |
| API sözleşmesi | **oRPC** (`@orpc/contract` + `@orpc/nest`) | 1.15 | Contract-first, Zod 4, OpenAPI 3.1 üretimi, TanStack Query bağları, RN'de çalışır | tRPC (OpenAPI alpha), ts-rest (bakım riski), elle Swagger + orval (yedek yol) |
| Doğrulama | Zod | 4.5 | Standard Schema, en geniş ekosistem | Valibot (istemci bundle'ı için opsiyonel), ArkType |
| ORM | Drizzle ORM + drizzle-kit | 0.45 (1.0 RC) | Yerel `vector()` tipi, SQL benzeri, incelenebilir migration'lar | Prisma 7 (`Unsupported("vector")`), Prisma 8 RC ⚠ |
| Veritabanı | PostgreSQL 16 + pgvector | – | Tek DB: ilişkisel + vektör + outbox | Ayrı vektör DB |
| Önbellek/kilit | Redis 7 | – | Rate-limit, kilit, SSE fan-out | – |
| İş akışı | Temporal TypeScript SDK | 1.23 (Nexus GA) | Durable execution, retry, zamanlayıcı, görünürlük | BullMQ (workflow durumu yok), Inngest/Trigger.dev (vendor) |
| Kimlik | **better-auth** (+ `@better-auth/expo`) | 1.7 | Self-host, passkey/TOTP/organizasyon eklentileri, Next + Expo tipli istemci | Lucia (ölü), Auth.js (bakım), Clerk (SaaS maliyeti; hızlı başlangıç istenirse ADR) |
| Gizli bilgi | Doppler (başlangıç) → Infisical (self-host) | – | EAS/CI senkronu kolay | SOPS yalnızca GitOps dosyaları |
| Log | pino (+ nestjs-pino) | 10.x | JSON, hızlı, redact | winston |
| İzleme | OpenTelemetry JS SDK 2.x + Sentry 10 | – | Trace/metrik OTel; hata Sentry; loglar Pino transport (OTel logs JS'de hâlâ "development") | – |
| E-posta | Resend (gönderim + inbound webhook) | – | Basit API, inbound | Postmark |
| Nesne depolama | Cloudflare R2 (S3 API) | – | Egress ücretsiz | S3 |

## 3. Web

| Katman | Seçim | Sürüm | Neden |
|---|---|---|---|
| Çerçeve | Next.js (App Router, Turbopack, React Compiler) | 16.3 | Standart; RSC gerekmiyor ama route/asset altyapısı olgun |
| React | 19.2 | – | Expo ile aynı sürüm |
| Bileşen tabanı | shadcn (Base UI varsayılan) | CLI 4.x / `@base-ui/react` 1.7 | Headless + kopyala-sahiplen; Base UI Radix'in bilinen combobox/odak hatalarını çözüyor |
| Stil | Tailwind v4 + CSS değişkenleri (token'lardan) | – | Token disiplini; `packages/ui` görünümü buradan |
| Veri | TanStack Query 5 + oRPC istemcisi | 5.102 | Tek istemci web+mobil |
| Durum | Zustand 5 (yalnızca UI tercihleri) | – | Küçük |
| Form | react-hook-form 7 + Zod resolver | – | En geniş ekosistem (TanStack Form 1.x alternatif) |
| Tablo/liste | TanStack Table + TanStack Virtual | – | Cursor sayfalama + sanallaştırma |
| Grafik | Kendi SVG bileşenleri + d3-scale | – | Az grafik var; kütüphane ağırlığı gereksiz |
| Video önizleme | Remotion Player | – | Şablon canlı önizleme |

## 4. Mobil

| Katman | Seçim | Sürüm | Neden |
|---|---|---|---|
| Çerçeve | Expo SDK 57 (RN 0.86, React 19.2, New Architecture zorunlu) | 57 | Dev client + EAS; SDK 58 canary |
| Yönlendirme | expo-router | 57.x (SDK ile numaralı) | Dosya tabanlı, derin bağlantı |
| Stil | **Unistyles 3** | 3.3 | Token/tema/breakpoint, New-Arch yerel, yeniden render yok; RN-Web desteği | NativeWind v5 (hâlâ preview), Tamagui 2 (kit istenirse) |
| Veri | TanStack Query 5 + persist (MMKV) | – | Offline okuma |
| Güvenli depolama | expo-secure-store | – | Token'lar |
| Push | expo-notifications | – | Kategori bazlı |
| Medya | expo-video, expo-image | – | 9:16 oynatıcı, önbellek |
| Yapı/dağıtım | EAS Build + EAS Update (kanal: production, kademeli) | – | Free: 15+15 build/ay, 1K MAU update; Production $199/ay ⚠ |
| Test | Jest 30 + RNTL (birim), **Maestro 2.10** (e2e) | – | Detox yalnızca gri-kutu gerekirse |

## 5. Ortak paketler

| Paket | Seçim |
|---|---|
| `packages/tokens` | DTCG JSON → küçük kendi üreticimiz (`scripts/build.ts`) → CSS değişkenleri (web) + TS tema (Unistyles); Tokens Studio/Figma senkronu gerekirse Style Dictionary 5'e geçilir |
| `packages/ui` | Web: shadcn/Base UI + Tailwind; RN: Unistyles ile yazılmış eş bileşenler; **aynı props arayüzü, iki uygulama**; Storybook 10 (web) + Storybook RN 10 (cihaz + RN-Web-Vite) |
| `packages/i18n` | **Lingui 6** (ICU, `.po` kataloglar, SWC eklentisi Next'te, Metro transformer Expo'da, pseudo-locale yerleşik) |
| `packages/contracts` | oRPC contract + Zod 4; `openapi.json` çıktısı; Prism mock; Pact contract testleri |
| `packages/domain` | Saf TS; fast-check property-based testler |
| `packages/adapters` | Platform sürücüleri + LLM/TTS/görsel/video sağlayıcı sürücüleri |

## 6. Test ve kalite araçları

| Araç | Sürüm | Kullanım |
|---|---|---|
| Vitest | 4.1 (5.0 bugün çıktı ⚠, birkaç hafta bekle) | Birim/entegrasyon/bileşen (`@vitest/browser`) |
| Playwright | 1.62 | Web e2e, a11y (`@axe-core/playwright` 4.13), görsel |
| Maestro | 2.10 | Mobil e2e YAML |
| Storybook | 10.6 | Bileşen dokümantasyonu, etkileşim testleri |
| MSW | 2.15 | HTTP mock (web/RN/Node); orval veya oRPC'den üretilen handler'lar |
| Prism | 5.16 | OpenAPI'den dinamik mock sunucu |
| Mockoon | 9.8 | Manuel QA için masaüstü mock |
| Testcontainers (node) | 12.1 | Postgres+pgvector, Redis, Temporal dev server |
| Pact JS | 17 | Web/mobil ↔ API tüketici sözleşmeleri |
| Stryker | 10 | Mutasyon (domain paketleri) |
| faker-js | 10 | Sahte veri fabrikaları |
| Argos | CLI 6.9 | Görsel regresyon (Hobby ücretsiz 5K ekran görüntüsü; Pro $100/ay) — Chromatic ($149/ay) alternatif |
| unlighthouse / lighthouse | – | Performans kapısı (**Lighthouse CI bakımsız**, kullanılmaz) |
| k6 | – | Yük |
| CodeQL, Semgrep, gitleaks, Trivy | – | Güvenlik |

## 7. Üretken AI ve medya sağlayıcıları (adaptör arkasında, değiştirilebilir)

| Görev | Birincil | Yedek |
|---|---|---|
| Yazım/yargıç | Claude Opus 5 (`claude-opus-5`) | GPT-5.6 Terra ⚠ / Gemini 3.1 Pro ⚠ |
| Sınıflandırma | Claude Sonnet 5 / Haiku 4.5 (batch) | Gemini Flash |
| TTS | ElevenLabs (Flash/v3) | Google Chirp 3 HD |
| Görsel | Nano Banana 2 / FLUX.2 pro / Ideogram (metinli) | Imagen 4 |
| Video B-roll | Kling 3.0 (fal.ai) | Veo 3.1 Fast |
| Altyazı | WhisperX (self-host) | OpenAI whisper-1 |
| Render | Remotion (self-host, ≤3 çalışan ücretsiz) + FFmpeg 8 + VHS | Remotion Lambda |
| Stok | Pexels, Pixabay | Unsplash (atıf) |

Ayrıntı ve fiyatlar: `../../research/sosyal-medya-otomasyon-yol-haritasi.md` §3.4.

## 8. Sürüm sabitleme politikası

- `pnpm catalog:` ile tüm workspace'te tek sürüm; Renovate haftalık, minor otomatik merge (CI yeşilse), major PR ile.
- Expo SDK yükseltmesi çeyrekte bir, `expo-upgrade` skill'i ile; RN sürümü Expo'nun pinlediği.
- Vitest 5, Prisma 8, Turborepo 3, NativeWind 5, Tamagui 3: **beklemede**; GA + 1 ay sonra değerlendirilir.
