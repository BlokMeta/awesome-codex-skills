# 01 — Sistem Mimarisi

## 1. Amaç ve bağlam

Heliograph üç yüzeyden oluşur:

| Yüzey | Kim kullanır | Ana iş |
|---|---|---|
| **Web paneli** (`apps/web`) | Operatör (siz), ileride ekip | Persona kurulumu, takvim, onay kuyruğu, inbox, CRM, analitik, ayarlar. Masaüstünde derin çalışma. |
| **Mobil uygulama** (`apps/mobile`) | Operatör, hareket hâlinde | Onay/red, alarmlara müdahale, para eşiği eskalasyonları, inbox'a hızlı yanıt, günün özeti, push bildirimleri. |
| **Arka plan sistemi** (`apps/api` + `apps/workers`) | Kimse doğrudan | Trend yakalama, içerik/medya üretimi, kalite kapısı, yayın, etkileşim, ölçüm, alarm. |

Web ve mobil aynı **contract** paketinden üretilmiş tipli istemciyi ve aynı **domain** paketindeki iş kurallarını (ör. yayın politikası doğrulaması, kota hesabı) paylaşır. Böylece "mobilde başka davranıyor" hatası sınıf olarak ortadan kalkar.

## 2. C4 — Bağlam

```
                    ┌──────────────────────────────┐
   Operatör ───────►│         HELIOGRAPH            │◄──── Push / Telegram / e-posta alarmları
   (web, mobil)     │  web · mobil · api · workers  │
                    └───┬──────────┬──────────┬────┘
                        │          │          │
        ┌───────────────▼──┐  ┌────▼─────┐  ┌─▼──────────────────────────┐
        │ Sosyal platform  │  │ Üretken  │  │ Veri kaynakları            │
        │ API'leri (6)     │  │ AI       │  │ HN, HF, GitHub, arXiv, RSS,│
        │ + e-posta        │  │ servisleri│ │ Tavily, Bluesky/Mastodon   │
        └──────────────────┘  └──────────┘  └────────────────────────────┘
```

## 3. C4 — Konteynerler

| Konteyner | Teknoloji | Sorumluluk | Ölçekleme |
|---|---|---|---|
| `web` | Next.js (App Router), React | SSR'sız SPA benzeri panel, auth, gerçek zamanlı durum (SSE) | Statik + edge; 1 replika yeter |
| `mobile` | Expo / React Native | iOS + Android; offline-first okuma, çevrimiçi yazma; push | Mağaza + EAS Update |
| `api` | NestJS (modüler monolit) | HTTP API, OAuth geri dönüşleri, platform webhook'ları, SSE, yetkilendirme | 2+ replika, stateless |
| `workers` | Temporal TS SDK | Uzun süren iş akışları: `ProduceShortVideo`, `PublishPost`, `EngagementSweep`, `TrendScan`, `MetricsCapture` | Kuyruk başına ayrı worker havuzu; medya worker'ı GPU/CPU ağır |
| `temporal` | Temporal server (self-host veya Cloud) | Durable execution, retry, zamanlayıcı, görünürlük | Ayrı |
| `postgres` | PostgreSQL 16 + pgvector | Tüm kalıcı veri, gömme vektörleri, outbox | Tek primary + replika |
| `redis` | Redis 7 | Rate-limit sayaçları, kısa ömürlü kilit, SSE fan-out | Tek |
| `object-store` | S3 uyumlu (R2) | Medya varlıkları, render çıktıları | – |
| `media-render` | Remotion + FFmpeg + VHS (Docker) | Video/görsel render; workers tarafından çağrılır | İş başına konteyner; yatay |
| `otel-collector` + Grafana yığını | OpenTelemetry, Loki, Tempo, Prometheus | İzleme | – |

## 4. Bounded context'ler (modüller)

Her modül `packages/domain/<context>` (saf) + `apps/api/src/modules/<context>` (Nest) + gerekiyorsa `apps/workers/src/<context>` (Temporal) olarak yaşar. Modüller **birbirinin tablosuna dokunmaz**.

| Context | Sahip olduğu kavramlar | Yayınladığı olaylar | Dinlediği olaylar |
|---|---|---|---|
| `identity` | Operator, Session, Role, ApiKey | `OperatorCreated` | – |
| `persona` | Persona, VoiceBible, VisualKit, TopicProfile, PostingPolicy, EngagementPolicy, QualityPolicy, WarmupStage | `PersonaActivated`, `PersonaPaused`, `TopicChanged` | – |
| `channel` | Channel, OAuthCredential, Capability, QuotaState, Health | `ChannelConnected`, `ChannelUnhealthy`, `QuotaNearLimit` | `PostPublished` (kota düş) |
| `trend` | Source, Signal, Cluster, Score | `ClusterEmerged`, `ClusterUpdated` | `TopicChanged` |
| `content` | Brief, Draft, Candidate, ContentVersion | `BriefCreated`, `DraftReady` | `ClusterEmerged`, `PersonaActivated` |
| `media` | Asset, RenderJob, Provenance, MediaLibraryItem | `AssetRendered`, `RenderFailed` | `DraftReady` |
| `quality` | GateRun, GateLayerResult, ReviewTask, ApprovedContent | `ContentApproved`, `ContentRejected`, `ReviewRequested` | `AssetRendered`, `DraftReady` |
| `publishing` | ScheduledPost, Post, PublishAttempt | `PostScheduled`, `PostPublished`, `PostFailed` | `ContentApproved` |
| `engagement` | Interaction, Classification, Reply, EscalationRule | `InteractionReceived`, `ReplySent`, `EscalationRaised` | `PostPublished` |
| `deals` | Lead, Deal, MediaKit, RateCard | `LeadCreated`, `DealStageChanged` | `EscalationRaised` (is_business) |
| `analytics` | MetricSnapshot, Experiment (bandit), WeeklyReport | `ReportReady` | `PostPublished`, `InteractionReceived` |
| `notification` | Alert, DeliveryChannel, Digest | – | Tüm `*Raised`, `*Failed`, `QuotaNearLimit` |
| `cost` | UsageRecord, Budget, Cutoff | `BudgetExceeded` | Tüm üretim olayları (kullanım kaydı) |

Kural: Bir modül başka bir modülün verisine ihtiyaç duyarsa (a) olayla kendi kopyasını tutar (denormalize, eventual consistency) veya (b) o modülün **public application service**'ini çağırır. Repository'ler modül-private.

## 5. Hexagonal katmanlar (her modülde)

```
packages/domain/content/
  src/
    model/          Brief.ts, Draft.ts, Candidate.ts, value-objects/
    events/         BriefCreated.ts ...
    policies/       HookSelectionPolicy.ts (saf fonksiyonlar)
    ports/          BriefRepository.ts, LlmWriter.ts (arayüzler)
    services/       ContentPlanner.ts (domain servisleri)
    index.ts        public API
  test/             birim testleri (fixtures, property-based)

apps/api/src/modules/content/
  application/      use-cases: CreateBrief.ts, GenerateDraft.ts (ports'u kullanır)
  infrastructure/   DrizzleBriefRepository.ts, ClaudeLlmWriter.ts (ports'u uygular)
  interface/        http/ (controller + DTO ↔ contract), events/ (handler'lar)
  content.module.ts DI kabloları
  README.md         modülün amacı, olayları, kararları
```

- `domain` → hiçbir şeye bağımlı değil.
- `application` → `domain` + ports.
- `infrastructure` → `application` + `domain` + dış kütüphaneler.
- `interface` → `application` + `contracts`.
- Ters yönlü import `dependency-cruiser` ile yasak.

## 6. Ana akışlar (sequence)

### 6.1 Trend → yayın

```
TrendScan (Temporal cron, 5 dk)
  → collectors (RSS/HN/HF/GitHub/arXiv/Tavily) → Signal[]
  → normalize + embed → cluster (pgvector) → score
  → ClusterEmerged(clusterId, score) [outbox]

content.on(ClusterEmerged) → her uygun persona için Brief (topic_profile eşleşmesi, angle seçimi)
  → BriefCreated → ProduceContent workflow başlar
      ├─ GenerateDraft (LLM, n aday)
      ├─ media: RenderAssets (carousel/görsel/video) — child workflow
      ├─ quality: RunGate (K1..K8) → ApprovedContent | ReviewTask
      └─ publishing: Schedule (persona saat penceresi + jitter)
PublishPost workflow (zamanı gelince)
  → channel capability + quota check → adapter.publish (Idempotency-Key)
  → PostPublished → analytics.MetricsCapture (1s/24s/7g timer'lar), channel.quota düş
```

### 6.2 Etkileşim

```
EngagementSweep (kanal başına Temporal cron, 10–20 dk jitter)
  → adapter.listComments/listConversations(since) → Interaction[] (dedup by external_id)
  → classify (LLM) → policy (persona.engagement_policy, channel.capabilities)
      ├─ auto-reply: draft (LLM) → quality gate (K1,K3,K8) → adapter.reply (gecikme timer'ı ile)
      ├─ human-draft (X, TikTok): ReviewTask
      ├─ is_business: deals.CreateLead + notification.Alert(warning)
      └─ is_money | is_legal: notification.Alert(critical), yanıt yok
```

### 6.3 Mobil onay

```
ReviewRequested → notification.Push(mobile) → operatör açar
  → GET /review-tasks/{id} (asset önizleme, gate raporu, öneri)
  → POST /review-tasks/{id}/decision {approve|reject|edit} (Idempotency-Key)
  → quality.ApprovedContent → publishing.Schedule
```

## 7. Gerçek zamanlı ve offline

- Web: SSE (`/events`) ile kuyruk/alarm/sağlık güncellemeleri; WebSocket gerekmez.
- Mobil: TanStack Query + persist (MMKV) ile son durum offline okunur; yazmalar kuyruklanır ve `Idempotency-Key` ile tekrar oynatılır; push (Expo Notifications) ile uyandırma.

## 8. Çoklu kiracı hazırlığı

İlk sürüm tek operatör (siz) içindir ama her tablo `workspace_id` taşır ve tüm sorgular RLS (row-level security) ile kısıtlanır. İleride ekip/ajans modeli için veri modeli değişmez.

## 9. Sınır ihlali örnekleri (yapılmayacaklar)

- `publishing` modülünün `content` tablosunu doğrudan okuması.
- Controller içinde iş kuralı.
- Domain sınıfında `@Injectable()` veya Drizzle importu.
- Worker'dan HTTP ile kendi API'ne istek (application service çağrılır).
- Sayfalama olmadan `findAll()`.
