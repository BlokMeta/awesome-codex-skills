# 12 — Teknik Yol Haritası

Her madde bir **epik**; altındaki hikâyeler kabul kriterleriyle. İşaretleme: `[ ]` yapılmadı, `[~]` sürüyor, `[x]` bitti (DoD sağlandı). Bu dosya canlı tutulur; her PR ilgili maddeyi günceller.

Süre tahminleri tek geliştirici + AI asistan içindir.

## M0 — Temel (Hafta 1–2)

- [x] **M0.1 Monorepo iskeleti** — pnpm workspaces + Turborepo; `packages/config` (tsconfig, biome, dependency-cruiser, vitest); `pnpm check` yeşil boş projede.
  - KK: `pnpm i && pnpm check` < 2 dk; boundaries kuralı örnek ihlalde kırılıyor.
- [~] **M0.2 Yerel ortam** (compose hazır; `pnpm dev` M1'de) — docker-compose: postgres+pgvector, redis, temporal (dev server), otel-collector, grafana, minio; `pnpm dev` tek komut.
- [~] **M0.3 CI `pr-check`** (lint/typecheck/test/boundaries/knip/openapi-diff/gitleaks canlı; e2e, a11y, perf, güvenlik taramaları uygulamalarla birlikte) — 17 kapının iskeleti (bazıları boş geçer); Turborepo remote cache.
- [x] **M0.4 Contracts paketi** (oRPC + Zod 4 → `openapi.json`; Prism/Spectral M0.3'te) — Zod → OpenAPI 3.1 → tipli istemci üretimi; Spectral; Prism mock sunucusu.
  - KK: `pnpm contracts:gen` deterministik (diff yok); örnek `GET /v1/health`.
- [x] **M0.5 Domain paketi iskeleti** — `Result`, `DomainError`, `Clock`, `Rng`, `Id` yardımcıları; ilk aggregate (`Persona`) + property-based test.
- [x] **M0.6 i18n paketi** (Lingui runtime, elle id'li mesajlar, Intl biçimleyiciler, pseudo, .po codec, `i18n:check`; SWC/Metro entegrasyonu uygulamalarla) — `tr`, `en`, `en-x-pseudo`; extract/check betikleri; lint kuralı ham string.
- [ ] **M0.7 UI paketi çekirdeği** — token'lar (Style Dictionary), yazı tipleri, `Button/Input/List/Sheet` web + RN; Storybook (web + RN); axe.
- [ ] **M0.8 Auth** — operatör kayıt/giriş, passkey + TOTP, oturum rotasyonu, RLS; e2e "giriş".
- [ ] **M0.9 Gözlemlenebilirlik temeli** — pino + OTel + requestId; Grafana panosu boş ama bağlı.
- [x] **M0.10 ADR-0001…0010** yazıldı (`docs/adr/`).
- [~] **M0.11 Config modülü (ADR-0011)** (domain: PolicyEntry, resolveEffective, staleness, reverify + seed hazır; DB/servis/cron M1'de) — `policy_entries`, `ConfigService`, tohum verisi (platform limitleri, fiyatlar, modeller, saklama süreleri), bayatlık gözcüsü cron'u, `GET /v1/health/config`, lint kuralı "sabit yasak".
  - KK: `verified_at` eşiği aşınca alarm testi (FakeClock); Instagram limit doğrulayıcı fixture testi.
- [~] **M0.13 Billing çekirdeği** (domain: assertEntitlement, credit ledger hazır) — `plans`, `plan_entitlements`, `EntitlementService.assert`, `credit_ledger`, `usage_records` → kredi düşümü; sağlayıcı yok (manual plan ile başlar).
- [~] **M0.14 Privacy çekirdeği** (domain: consent modeli hazır — `ai_processing` dahil) — `consent_records` (metin sürümü kabulü), hesap silme (30 gün), veri dışa aktarma, Meta Data Deletion Callback uç noktası + onay kodu sayfası, herkese açık silme web sayfası (Play).
- [~] **M0.12 Kiracı modeli** (domain: rol/izin matrisi, authorize, changeRole hazır)

## M1 — Persona ve kanal (Hafta 3–4)

- [ ] **M1.1 Persona CRUD + sihirbaz (web)** — 6 adım, kaydet/devam; ses kitabı AI taslağı (`LlmWriter`); görsel kit önizleme.
  - KK: e2e "persona sihirbazı"; sahte dil ile taşma yok; RTL story.
- [ ] **M1.2 Channel modülü** — OAuth başlatma/callback (Telegram bot token girişi, Threads, X, Instagram, YouTube; TikTok sandbox), zarf şifreleme, kabiliyet matrisi, kota durumu.
  - KK: token yenileme cron testi (FakeClock); sağlık geçişleri olay üretir.
- [ ] **M1.3 Platform adaptörleri v1** — `PlatformAdapter` arayüzü; Telegram (tam), Threads (metin/görsel), X (metin/görsel, "Automated" etiketi kontrol listesi) ; fixture tabanlı contract testleri.
- [ ] **M1.4 Notification modülü** — alert tablosu, Telegram bot bildirimi, e-posta (Resend), panel rozeti; alarm yorgunluğu kuralı.
- [ ] **M1.5 Mobil iskelet** — Expo Router, sekmeler, auth, TanStack Query persist, push kaydı; Maestro "giriş" akışı.
- [ ] **M1.6 Ödeme sağlayıcısı (ADR-0013)** — MoR entegrasyonu (checkout, webhook → `subscriptions`, fatura PDF), deneme süresi, plan yükseltme/düşürme, iptal (tek tıkla, yasal gereklilik), mobilde hak okuma + mağaza kuralına uygun satın alma yönlendirmesi.
- [ ] **M1.7 Onboarding** — kayıt → e-posta doğrulama → workspace → ilk kanal bağlama → mod seçimi (tam otomatik / manuel kütüphane) → ilk plan; hukuki metin kabulleri (`consent_records`).
- [ ] **M1.8 Pazarlama sitesi + hukuki sayfalar** — `apps/site` (statik): fiyatlandırma (config'ten), gizlilik, şartlar, KVKK, çerez, veri silme talimatı (Meta), iletişim; `legal/` sürümleri.
- [ ] **M1.9 Platform app review paketi** — Meta App Review + Business Verification, Google OAuth doğrulaması, TikTok audit için demo videoları ve ekran görüntüleri; staging ortamında kayıt.

## M2 — Trend ve metin içerik (Hafta 5–7)

- [ ] **M2.1 Trend modülü** — kaynak toplayıcılar (RSS, HN, HF, GitHub, arXiv, Tavily, Bluesky), normalize, embed, küme, skor; `TrendScan` workflow (5 dk).
  - KK: aynı haber 3 kaynaktan gelince tek küme; skor testi property-based; p50 keşif < 10 dk (staging ölçümü).
- [ ] **M2.2 Content modülü** — brief oluşturma (topic_profile eşleşme), `GenerateDraft` (n aday, persona ses kitabı, prompt sürümleme, prompt caching), kanal başına metin.
- [ ] **M2.3 Quality modülü v1** — K1 (kural), K3 (stil yargıcı), K4 (özgünlük pgvector), K8 (risk); `ReviewTask`; `ApprovedContent` markalı tip.
  - KK: kapı geçmeden `publish` derlenmez (tip testi); eval seti 100 örnek, AI-kokusu rubriği.
- [ ] **M2.4 Publishing modülü** — zamanlayıcı (pencere + jitter), `PublishPost` workflow, idempotency, kota bütçeleyici, etiket alanları (ad/aiDisclosed/automated).
- [ ] **M2.5 Web: Trendler, Kuyruk, Takvim ekranları** — HorizonStrip, TrendHeat, GateReport, sürükle-bırak; SSE.
- [ ] **M2.6 Mobil: Bugün + Kuyruk** — kaydırarak onay, GateReport sheet, offline karar kuyruğu.
- [ ] **M2.8 Platform veri hijyeni** — YouTube API verisi 30 günde tazeleme/silme ❓, X'te silinen içeriği yansıtma, Meta/TikTok deauthorization webhook'ları → `erasure_requests`.
- [ ] **M2.7 Analytics v1** — 1s/24s/7g metrik toplama, post_features etiketleme.
- **Çıktı:** 1 persona, Telegram + Threads + X, günde 5 metin post, insan onaylı, mobilden onay.

## M3 — Video ve medya (Hafta 8–12)

- [ ] **M3.1 Media modülü** — asset, provenance, presigned upload, ClamAV, EXIF temizliği (C2PA korunur).
- [ ] **M3.2 Render servisi** — Remotion kompozisyonları (haber, eğitici, hot take), VHS terminal sandbox (Docker, ağ kapalı), FFmpeg normalizasyon, WhisperX altyazı, thumbnail.
  - KK: 45 sn video < 4 dk render; deterministik (aynı girdi aynı hash).
- [ ] **M3.3 `ProduceShortVideo` workflow** — script JSON → TTS → görsel malzeme (paralel child activity'ler) → montaj → K6/K7 kapıları.
- [ ] **M3.4 Adaptörler v2** — YouTube (Shorts, `containsSyntheticMedia`), Instagram (Reels/carousel, IPTC AI işareti), TikTok (SELF_ONLY sandbox), X medya v2.
- [ ] **M3.5 Web: Kütüphane + Şablonlar** — Remotion canlı önizleme, gün aşırı plan kurucu.
- [ ] **M3.6 Mobil: medya önizleme** — 9:16 oynatıcı, carousel; kütüphaneye fotoğraf yükleme (kamera rulosu); **"içeriği bildir"** düğmesi (Google Play AI-Generated Content policy).
- [ ] **M3.7 Cost modülü** — usage_records, bütçe, kesici; panel maliyet sayacı.
- **Çıktı:** günde 2 video, 5 kanal.

## M4 — Etkileşim ve fırsatlar (Hafta 13–16)

- [ ] **M4.1 Engagement modülü** — `EngagementSweep`, sınıflandırma, politika motoru (Meta 24 saat penceresi zorlaması), yanıt üretimi + kapı, gecikme dağılımı, X insan-taslak modu, X compliance stream tüketicisi (24 saat silme SLA).
  - KK: prompt injection test seti (yorumda "ignore instructions" → politika motoru geçmez).
- [ ] **M4.2 E-posta gelen kutusu** — inbound webhook, aynı sınıflandırma.
- [ ] **M4.3 Deals modülü** — lead/deal, medya kiti üretimi (haftalık), rate card, MoneyLine alarmı.
- [ ] **M4.4 Web: Inbox + Fırsatlar** — birleşik inbox, kanban.
- [ ] **M4.5 Mobil: Inbox + Fırsatlar** — sohbet görünümü, tek dokunuş yanıt, "Ben devralıyorum" derin bağlantı; kritik push kategorisi.
- [ ] **M4.6 Privacy** — anonimleştirme cron'u, silme uç noktası, KVKK metinleri.
- **Çıktı:** yorum/DM/e-posta yanıtı canlı; para eşiği alarmı mobilde.

## M5 — Ölçek ve öğrenme (Hafta 17–20)

- [ ] **M5.1 Warming ve kota bütçeleyici** — persona aşamaları, hacim kademesi, çoklu persona kota paylaşımı.
- [ ] **M5.2 Thompson sampling** — kanca/format/saat kolları, haftalık rapor (SignalLog), yorum madenciliği → brief.
- [ ] **M5.3 Çoklu LLM sağlayıcı** — Claude + yedek (GPT/Gemini) adaptörleri, kesinti failover, eval paritesi.
- [ ] **M5.4 Analytics ekranı** — SignalLog, az grafik, deney sonuçları.
- [ ] **M5.5 Kalite kapısı v2** — K2 doğruluk (kaynak karşılaştırma), K5 dedektör sinyali, K6 video (OCR, sessizlik), otomatik mod eşikleri.
- [ ] **M5.6 Yük ve kaos** — k6 senaryoları, Temporal failure injection, 20 persona simülasyonu (sahte platformlar).
- **Çıktı:** 20 persona hedefi teknik olarak destekleniyor.

## M6 — Mağaza ve sertleştirme (Hafta 21–22)

- [ ] **M6.1 Mobil mağaza yayını** — TestFlight/Play internal → prod; gizlilik beyanları; demo hesap.
- [ ] **M6.2 Güvenlik gözden geçirme** — ASVS L2 kontrol listesi, dış pentest (isteğe bağlı), CodeQL temiz.
- [ ] **M6.3 Erişilebilirlik denetimi** — WCAG 2.2 AA manuel tur (ekran okuyucu, klavye), mobil VoiceOver/TalkBack.
- [ ] **M6.4 Runbook'lar ve tatbikat** — geri yükleme, OTA geri alma, token sızıntısı.
- [ ] **M6.5 Dokümantasyon** — modül README'leri, ADR'ler, kullanıcı kılavuzu (tr/en).

## Sonrası (backlog)

- Uzun video hattı (16:9, 5–8 dk); LinkedIn adaptörü; Bluesky/Mastodon yayın; ekip rolleri ve çoklu workspace; Zernio/Ayrshare yedek sürücü; Remotion Lambda render; sesli komutla mobil onay; Postiz uyumlu içe aktarma.

## Bağımlılık grafiği (özet)

```
M0 → M1 → M2 → M3 → M4 → M5 → M6
       └──────────── mobil iskelet (M1.5) her M ile birlikte ilerler
Dış: TikTok audit (M1'de başvur, M3'te gerek), YouTube compliance audit (M1'de başvur, M3'te gerek), X AI-yanıt ön onayı (M4)
```
