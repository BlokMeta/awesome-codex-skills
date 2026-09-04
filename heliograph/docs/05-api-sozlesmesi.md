# 05 — API Sözleşmesi

## 1. İlkeler

- **Contract-first:** `packages/contracts/src/<ctx>/*.ts` içinde Zod şemaları ve rota tanımları; buradan OpenAPI 3.1 (`openapi.json`) ve tipli istemci (web + mobil) üretilir. El yazımı fetch yok.
- **Kaynak odaklı REST + komut uç noktaları.** CRUD için kaynak; iş akışı tetikleyen işlemler için `POST /<resource>/{id}:<verb>` (ör. `POST /review-tasks/{id}:decide`).
- **Sürümleme:** `/v1` yol ön eki; kırıcı değişiklik = yeni sürüm + eski sürüm 6 ay.
- **JSON only**, `camelCase` alanlar, tarihler ISO-8601 UTC, para `{ amount: "12.50", currency: "USD" }` (string; float yasak), kimlikler ULID.

## 2. Sayfalama (zorunlu, tek biçim)

İstek: `GET /v1/posts?limit=25&cursor=eyJ...&sort=-publishedAt&filter[channelId]=...`

Yanıt:
```json
{
  "data": [ ... ],
  "page": { "nextCursor": "eyJ...", "prevCursor": null, "limit": 25, "hasMore": true },
  "meta": { "requestId": "01J..." }
}
```

- Cursor opaque (base64url JSON: `{k: sortKey, id}`), imzalı değil ama sürüm alanı taşır; geçersizse `400 invalid_cursor`.
- `limit` 1–100, varsayılan 25. `total` **verilmez** (pahalı); gerekiyorsa ayrı `GET .../count` (önbellekli, yaklaşık).
- Sıralama yalnızca indeksli alanlarda; şemada `sortable: [...]` listesi.
- Filtreler `filter[alan]=deger`, `filter[alan][op]=deger` (`eq, in, gte, lte, contains`).

## 3. Hata biçimi (RFC 9457 Problem Details)

```json
{
  "type": "https://heliograph.app/problems/quota-exceeded",
  "title": "Quota exceeded",
  "status": 429,
  "detail": "Channel ig:deniz has 0 of 100 daily publishes left.",
  "instance": "/v1/posts/01J...",
  "code": "channel.quota_exceeded",
  "messageId": "errors.channel.quotaExceeded",
  "params": { "channel": "ig:deniz", "resetAt": "2026-09-04T00:00:00Z" },
  "requestId": "01J...",
  "errors": [ { "path": "body.scheduledFor", "code": "validation.past", "messageId": "errors.validation.past" } ]
}
```

- `code` makine için, `messageId` + `params` istemci i18n için. `detail` İngilizce, geliştirici için.
- Durum kodları: 400 doğrulama, 401 kimlik, 403 yetki, 404, 409 çakışma/idempotency, 422 iş kuralı (`Result.err`), 429 kota/rate, 500 beklenmeyen (trace id ile), 503 bağımlılık.

## 4. Idempotency

- Tüm `POST`/`PATCH` yan etkili uç noktalar `Idempotency-Key` başlığı kabul eder (ULID, 24 saat saklanır, `identity` modülü tablosu).
- Aynı anahtar + aynı gövde → önbellekli yanıt (`Idempotent-Replayed: true`); aynı anahtar + farklı gövde → `409 idempotency_mismatch`.
- İstemciler (özellikle mobil offline kuyruğu) her mutasyona anahtar üretir.

## 5. Kimlik ve yetki

- Kimlik uçları better-auth tarafından `/v1/auth/*` altında sunulur (ADR-0007): `sign-up/email`, `sign-in/email`, `sign-out`, `get-session`, `verify-email`, `two-factor/*`, `passkey/*`, `organization/*` (create, set-active, invite-member, accept-invitation, has-permission…). Bu uçlar oRPC sözleşmesinin dışındadır; OpenAPI'leri better-auth `openAPI` eklentisiyle ayrı üretilir (M1).
- Oturum: veritabanı oturumu; web'de HttpOnly `hg.session_token` cookie'si, mobilde `set-auth-token` başlığından alınan Bearer token (SecureStore). Oturum önbelleği yok: iptal ve çalışma alanı değişimi bir sonraki istekte görünür (kural 13).
- Kiracı bağlamı: `session.activeOrganizationId` = aktif `workspaceId`; her kiracı uç noktası bunu `withWorkspace` ile RLS'e taşır.
- Yetki: RBAC (`owner, admin, editor, viewer`; `packages/domain/identity`) + kaynak sahipliği (`workspaceId`). Aynı matris better-auth `ac/roles` olarak da tanımlıdır (`access-control.ts`, drift testi ile). Kontrol application katmanında.
- Korumalı uç noktalar `SessionGuard` (global) ile; `@Public()` yalnızca health, webhook ve hukuki sayfalar için. Oturumsuz istek → `401 application/problem+json` (`code: auth.unauthenticated`).
- Rate limit: kullanıcı başına 600 istek/dk; yanıt başlıkları `RateLimit-*` (IETF taslağı).

## 6. Gerçek zamanlı

- `GET /v1/events` (SSE): `review.requested`, `alert.raised`, `post.published`, `channel.health`, `job.progress`. `Last-Event-ID` ile devam. Mobilde SSE yerine push + poll.

## 7. Webhook'lar (gelen)

- `/webhooks/<platform>`: imza doğrulama (HMAC), ham gövde saklama, hızlı 200, işleme Temporal'a devredilir; tekrarlar `external_id` ile elenir.

## 8. Dosya yükleme

- Doğrudan nesne depolamaya **presigned URL** (`POST /v1/uploads:presign` → PUT); API üzerinden byte geçmez. Tamamlanınca `POST /v1/uploads/{id}:complete` → virüs taraması + medya kütüphanesi.

## 9. Uç nokta envanteri (v1, özet)

| Kaynak | Uç noktalar |
|---|---|
| auth | better-auth: `POST /auth/sign-up/email`, `/auth/sign-in/email`, `/auth/sign-out`, `GET /auth/get-session`, `/auth/verify-email`, `POST /auth/two-factor/{enable,verify-totp,disable}`, `/auth/passkey/*`, `POST /auth/organization/{create,set-active,invite-member,accept-invitation,has-permission}` |
| identity | `GET /me` (operatör + üyelikler + aktif çalışma alanı) — **canlı** |
| personas | `GET/POST /personas`, `GET/PATCH /personas/{id}`, `POST /personas/{id}:activate`, `:pause`, `GET /personas/{id}/health` |
| channels | `GET /channels`, `POST /channels/oauth/{platform}:start`, `/callback`, `PATCH /channels/{id}`, `POST /channels/{id}:refresh`, `GET /channels/{id}/quota` |
| trends | `GET /trends/clusters` (sayfalı, skor sıralı), `GET /trends/clusters/{id}`, `POST /briefs` (manuel brief) |
| briefs / drafts | `GET /briefs`, `GET /briefs/{id}`, `POST /briefs/{id}:regenerate` |
| assets | `GET /assets/{id}`, `GET /assets/{id}/preview` |
| review-tasks | `GET /review-tasks` (filter status), `GET /review-tasks/{id}`, `POST /review-tasks/{id}:decide`, `POST /review-tasks:bulk-decide` |
| schedule | `GET /schedule?from&to&personaId`, `PATCH /scheduled-posts/{id}` (zaman), `POST /scheduled-posts/{id}:publish-now`, `:skip` |
| posts | `GET /posts`, `GET /posts/{id}`, `GET /posts/{id}/metrics` |
| inbox | `GET /interactions` (filter kind/status/persona), `GET /interactions/{id}`, `POST /interactions/{id}:reply`, `:ignore`, `:escalate` |
| deals | `GET/POST /deals`, `PATCH /deals/{id}`, `GET /personas/{id}/media-kit` |
| media-library | `GET/POST /media-library`, `PATCH /media-library/{id}`, `GET/PUT /personas/{id}/library-plan` |
| analytics | `GET /analytics/overview`, `/analytics/personas/{id}`, `/analytics/experiments`, `GET /reports/weekly` |
| alerts | `GET /alerts`, `POST /alerts/{id}:ack` |
| settings | `GET/PATCH /settings/notifications`, `/settings/budgets`, `/settings/providers` (anahtar maskeli) |
| templates | `GET/POST /templates`, `POST /templates/{id}:preview` |
| audit | `GET /audit-log` |
| i18n | `GET /i18n/locales` (mevcut diller, tamamlanma yüzdesi) |

## 10. Değişiklik süreci

1. Şemayı `packages/contracts`'ta değiştir → `pnpm contracts:gen`.
2. Spectral lint yeşil; kırıcı değişiklik tespiti (`openapi-diff`) → sürüm kararı.
3. Backend uygular; contract testi yanıtı şemaya karşı doğrular.
4. Web/mobil üretilmiş istemciyi kullanır; tip hatası = eksik uyarlama.
