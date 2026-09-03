# 03 — Kodlama Kuralları

Amaç: Kodun kim tarafından yazıldığından bağımsız olarak aynı görünmesi, aynı şekilde test edilmesi, aynı şekilde başarısız olması.

## 1. Dil ve derleyici

- TypeScript **strict** + `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `verbatimModuleSyntax`. `any` yasak (`unknown` + daraltma). `as` yalnızca test kodunda ve boundary'de (dış API yanıtını Zod ile parse ettikten sonra bile gerek yok).
- Hedef: ESM, Node 22 LTS. `tsconfig` tabanı `packages/config/tsconfig.base.json`.
- Biome format + çekirdek lint; ESLint 10 yalnızca plugin kuralları (react-hooks, jsx-a11y, react-native, typescript-eslint tipli). Kural setleri `packages/config/`. Yerel override yasak; kural gevşetme = ADR.

## 2. Adlandırma

| Şey | Kural | Örnek |
|---|---|---|
| Dosya | `kebab-case.ts`; bileşen dosyası `PascalCase.tsx` | `brief-repository.ts`, `ReviewCard.tsx` |
| Tip/sınıf | `PascalCase` | `PostingPolicy` |
| Fonksiyon/değişken | `camelCase`, fiil ile başlar | `scheduleNextWindow()` |
| Sabit | `SCREAMING_SNAKE` yalnızca gerçek sabitlerde | `MAX_PAGE_SIZE` |
| Domain event | Geçmiş zaman | `PostPublished` |
| Use-case | Emir kipi, tek sorumluluk | `ApproveReviewTask` |
| Port (arayüz) | Ne yaptığı, "I" ön eki yok | `LlmWriter`, `BriefRepository` |
| Adapter | Teknoloji + port | `ClaudeLlmWriter`, `DrizzleBriefRepository` |
| Boolean | `is/has/can/should` | `isWithinQuota` |
| Zod şema | `<Name>Schema`, çıkarılan tip `<Name>` | `BriefSchema`, `type Brief` |
| i18n mesaj id | `context.screen.element` | `review.card.approve` |
| DB tablo | `snake_case`, çoğul | `review_tasks` |
| Env | `HG_` ön eki | `HG_DATABASE_URL` |

## 3. Modül yapısı ve bağımlılık yönü

Bkz. `01-mimari.md` §5. Ek kurallar:

- Her paket/modülün `index.ts`'i public API'dir; derin import (`@heliograph/domain/content/src/model/Brief`) yasak.
- Döngüsel bağımlılık yasak (dependency-cruiser).
- Bir dosya > 300 satır veya bir fonksiyon > 40 satır ise bölünür (Biome `complexity` kuralları).
- Barrel export yalnızca `index.ts`; ara dizinlerde yok (tree-shaking).

## 4. Hata yönetimi

- Domain: `Result<T, DomainError>` (neverthrow benzeri kendi minimal tipimiz) döner; **throw yok**. Beklenen başarısızlıklar (kota dolu, kapı reddi) hata değil, sonuçtur.
- Application: `Result` üst katmana taşır; beklenmeyen hatalar (DB bağlantısı) `throw`.
- Interface (HTTP): `Result.err` → Problem Details (`05-api-sozlesmesi.md`); `throw` → 500 + trace id, gövdede ayrıntı yok.
- Hata sınıfları `code` (makine), `messageId` (i18n) taşır; kullanıcıya mesaj **istemcide** çevrilir.
- Dış API hataları adaptörde `classifyError()` ile `retryable | quota | auth | policy | fatal` olarak sınıflandırılır; Temporal retry politikası bu sınıfa göre.

## 5. Asenkron ve dayanıklılık

- Dış etkisi olan işlemler yalnızca Temporal activity içinde; activity'ler idempotent (`Idempotency-Key` = workflowId + adım).
- Timeout'suz `await` yok; her dış çağrının `AbortSignal` ve süre sınırı var.
- `Promise.all` yerine hata toleransı gerekiyorsa `Promise.allSettled`.
- Zaman: yalnızca enjekte edilen `Clock` portu; `Date.now()` doğrudan çağrılmaz (test edilebilirlik). Zaman dilimi: DB'de UTC, persona `timezone` ile sunum.

## 6. Veri erişimi

- Drizzle şemaları `apps/api/src/modules/<ctx>/infrastructure/schema.ts`; modül dışından import yasak.
- Her sorgu `workspace_id` filtreli (RLS ek güvence).
- N+1 yasak; liste uç noktaları tek sorgu + cursor.
- Migration'lar geri alınabilir ve **genişlet → taşı → daralt** (expand/migrate/contract) düzeninde; kolon silme ayrı sürümde.
- JSONB alanları Zod ile okunur/yazılır; ham JSON tip yok.

## 7. LLM çağrıları

- Tüm LLM erişimi `LlmWriter` / `LlmJudge` / `LlmClassifier` portları üzerinden; sağlayıcı adaptörleri `packages/adapters/llm/*`.
- Prompt'lar koda gömülmez; `prompts/<name>.v<N>.md` olarak sürümlenir ve hash'i çıktı meta verisine yazılır.
- Yapılandırılmış çıktı zorunlu (JSON şema); serbest metin parse edilmez.
- Her çağrı `cost` modülüne kullanım kaydı bırakır (token, model, süre).
- Prompt önbelleği için sabit ön ek (persona ses kitabı) her zaman en başta; değişken içerik sonda.

## 8. React (web + mobil ortak)

- Bileşenler fonksiyon; `packages/ui` içindekiler platform-agnostik (web ve RN için iki uygulama, tek API).
- Sunum bileşeni (props → JSX) ve konteyner (veri) ayrımı; sunum bileşenleri Storybook'ta.
- Veri: TanStack Query; anahtar fabrikası `queryKeys.<ctx>.<op>(params)`; mutasyonlar optimistic + rollback.
- Form: şema (Zod, contracts'tan) → form; elle doğrulama yok.
- Durum: URL > sunucu durumu > yerel bileşen durumu > global store. Global store yalnızca UI tercihleri.
- Erişilebilirlik: her etkileşimli öğe erişilebilir isim; odak görünür; RN'de `accessibilityRole/Label`.
- Ham string yok (`lint:i18n` kuralı).

## 9. Yorum ve doküman

- Yorum "neden"i açıklar, "ne"yi değil. TODO yalnızca issue linkiyle.
- Her modülde `README.md`: amaç, kavramlar, olaylar, kararlar, açık sorular.
- Public fonksiyonlarda kısa TSDoc; örnek içerir.

## 10. Git

- Branch: `feat/<ctx>-<kisa>`, `fix/…`, `chore/…`, `docs/…`.
- Conventional Commits; gövdede "neden". Squash merge.
- PR küçük (< 400 satır net), tek amaç; büyükse dilimle.
- `main` korumalı: CI yeşil + 1 onay + `pnpm check` zorunlu.

## 11. Yasaklar listesi (hızlı kontrol)

`any`, `// @ts-ignore`, `console.log` (logger var), `Date.now()` (Clock var), `offset` sayfalama, ham SQL string birleştirme, `setTimeout` ile retry, domain'de framework importu, controller'da iş kuralı, i18n dışı metin, test olmayan public fonksiyon, `.env` commit, gizli bilgi loglama, `Math.random()` domain'de (Rng portu).
