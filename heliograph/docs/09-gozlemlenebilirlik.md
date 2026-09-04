# 09 — Gözlemlenebilirlik ve Operasyon

## 1. Üç sinyal, tek bağlam

- **İzler (traces):** OpenTelemetry; HTTP → application → Temporal workflow/activity → adaptör HTTP çağrısı tek trace. `requestId` (ULID) HTTP'de, `workflowId` Temporal'da; ikisi de log ve span'lara yazılır.
- **Loglar:** `pino` JSON; alanlar: `ts, level, msg, requestId, workflowId, workspaceId, personaId, channelId, module, code`. İnsan okunur metin yalnızca `msg`. Seviye: `debug` yerel, `info` prod; `warn` beklenen başarısızlık, `error` beklenmeyen.
- **Metrikler:** Prometheus; RED (rate, errors, duration) her uç nokta ve activity için; iş metrikleri aşağıda.

**Uygulama (M0.9):** `apps/api/src/telemetry.ts` — `HG_OTEL_EXPORTER_OTLP_ENDPOINT` verilince NodeSDK başlar (OTLP/HTTP trace + metrik, 30 sn push); yoksa kapalı, sıfır maliyet. İstek span'leri `@fastify/otel` eklentisinden (ESM'de loader hook gerekmez), dış HTTP çağrıları `instrumentation-undici`'den, veritabanı transaction'ları `withWorkspace/withoutTenant` içindeki elle `db.transaction` span'inden (`hg.tenant_scope`, `hg.workspace_id`, `hg.reason` nitelikleri). pino satırlarına `traceId/spanId` mixin ile eklenir. İş metrikleri `meter()` ile `hg_*` adıyla; ilk örnek `hg_config_stale_keys{level}` (bayatlık gözcüsü). Testte bellek içi exporter'lar seam olarak enjekte edilir (`test/telemetry.test.ts`).

## 2. İş metrikleri (Grafana "Signal Desk" panosu)

| Metrik | Tür | Neden |
|---|---|---|
| `hg_posts_published_total{platform,persona}` | counter | Hacim hedefi (günde 5+2) |
| `hg_publish_latency_seconds{platform}` | histogram | Zamanında yayın |
| `hg_gate_pass_ratio{layer}` | gauge | Kalite kapısı hangi katmanda düşürüyor |
| `hg_review_queue_depth` | gauge | İnsan darboğazı |
| `hg_trend_to_publish_seconds` | histogram | "En hızlı yakalayan" hedefi (< 45 dk) |
| `hg_interaction_reply_latency_seconds` | histogram | İnsan gibi gecikme dağılımı |
| `hg_escalations_total{kind}` | counter | Para/hukuk alarmları |
| `hg_channel_health{status}` | gauge | Ban/token riski |
| `hg_quota_remaining{platform,channel}` | gauge | Kota |
| `hg_llm_cost_usd_total{model,module}` | counter | Maliyet |
| `hg_render_duration_seconds{kind}` | histogram | Medya darboğazı |

## 3. SLO'lar

| Servis | SLI | Hedef |
|---|---|---|
| API | Başarı oranı (5xx hariç) | %99.9 / 30 gün |
| API | p95 gecikme (liste uç noktaları) | < 300 ms |
| Yayın | Planlanan zaman ± 5 dk içinde yayınlanan | %99 |
| Trend | İlk kaynaktan brief'e | p50 < 20 dk, p95 < 45 dk |
| Onay | Push'tan ekrana | < 10 sn |
| Mobil | Çökme oranı (Sentry) | < %0.5 oturum |

Hata bütçesi tükenince yeni özellik dondurulur, güvenilirlik işi öne alınır.

## 4. Alarmlar (kime, nasıl)

| Alarm | Koşul | Kanal |
|---|---|---|
| Kritik iş | para/hukuk eskalasyonu, kanal `banned/restricted`, bütçe %100 | Push (kritik) + Telegram + e-posta |
| Uyarı iş | kota %80, token 24 saat içinde dolacak, onay kuyruğu > 20 | Push (normal) + panel |
| Teknik | SLO yanma hızı, worker down, Temporal task queue backlog > 100, render başarısızlık > %10 | Grafana → Telegram ops kanalı |
| Maliyet | günlük LLM/medya harcaması bütçenin %80'i | Push + panel; %100'de otomatik kesici |

Alarm yorgunluğu: aynı alarm 30 dk içinde tekrarlanmaz; alarm `ack` edilebilir; her alarm bir runbook linki taşır.

## 5. Panolar

1. **Signal Desk** (iş): hacim, gecikme, kapı, kuyruk, maliyet.
2. **Platform Health**: kanal sağlığı, kota, API hata oranları platform başına.
3. **Pipelines**: Temporal workflow durumları, activity retry'ları, render süreleri.
4. **API**: RED, p95, hata kodları dağılımı.
5. **Mobile**: çökme, TTI, sürüm dağılımı, OTA benimseme.

## 6. Operasyon

- Ortamlar: `local` (docker-compose), `staging` (prod kopyası, sahte platform sunucuları), `prod`.
- Temporal görünürlük UI'ı operatöre açık (salt okunur), takılan workflow'lar oradan iptal/yeniden başlatılır.
- Yedek: Postgres günlük tam + WAL; nesne depolama sürümleme; aylık geri yükleme tatbikatı.
- Feature flag: basit DB tablosu + `FlagService`; her yeni akış flag arkasında çıkar.
- Runbook'lar: `docs/runbooks/*.md` (token yenileme başarısız, kota tükendi, LLM sağlayıcı 5xx, render kuyruğu şişti, mobil OTA geri alma).
