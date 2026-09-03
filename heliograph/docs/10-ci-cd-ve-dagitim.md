# 10 — CI/CD ve Dağıtım

## 1. Pipeline'lar (GitHub Actions)

| Workflow | Tetik | Adımlar |
|---|---|---|
| `pr-check` | PR | Turborepo önbellekli: format/lint → typecheck → boundaries → knip/syncpack → i18n:check → unit+component → integration (Testcontainers) → contract → security (gitleaks, Semgrep, audit) → build → e2e web (Playwright, sharded) → a11y → Lighthouse CI → size-limit → görsel regresyon. Kapsam ve mutasyon raporu PR yorumu. |
| `mobile-check` | PR (`apps/mobile`, `packages/ui`, `packages/i18n` değişince) | RNTL testleri → EAS build (development profile, iOS sim + Android apk) → Maestro akışları (EAS Workflows veya kendi runner) |
| `main-deploy` | `main` push | Docker image build (api, workers, web) → Trivy → staging deploy → DB migrate (expand) → smoke e2e → Temporal worker rolling |
| `release` | tag `v*` | changelog üretimi → prod deploy (blue/green) → migrate → smoke → mobil EAS Update (OTA) veya EAS Submit (native değişiklikte) |
| `nightly` | cron | Stryker mutasyon, k6 yük, LLM eval seti, bağımlılık güncellemeleri (Renovate PR'ları), lisans taraması |

## 2. Ortamlar

| Ortam | Amaç | Platform bağlantıları |
|---|---|---|
| local | geliştirme | Prism mock + MSW; isteğe bağlı gerçek Telegram test kanalı |
| staging | ön-üretim | Gerçek API'ler, yalnızca test hesapları (özel görünürlük); TikTok SELF_ONLY |
| prod | canlı | Gerçek hesaplar |

Gizli bilgiler Doppler/Vault'tan ortam başına; CI OIDC ile bulut kimliği (uzun ömürlü anahtar yok).

## 3. Dağıtım hedefi

- Başlangıç: tek VPS + docker-compose (api, workers×2, web, temporal, postgres, redis, otel, grafana). Medya render ayrı konteyner, gerekirse ayrı makine.
- Ölçek: k3s; api/workers Deployment, temporal Helm, postgres yönetilen (Neon/Supabase/RDS) veya CloudNativePG.
- Web: statik export + edge (Cloudflare Pages) veya aynı VPS'te Next standalone.

## 4. Veritabanı migration politikası

- Drizzle migration dosyaları PR'da; CI boş DB + son staging dump'ında uygular ve geri alır.
- Expand/migrate/contract: kolon ekle → kod iki alanı yazsın → veri taşı → eski kolonu bir sonraki sürümde sil.
- Migration'lar deploy'dan **önce**, geriye uyumlu; uzun süren backfill'ler Temporal batch workflow ile.

## 5. Mobil yayın

- EAS Build profilleri: `development` (dev client), `preview` (internal TestFlight / Play internal), `production`.
- Sürümleme: `runtimeVersion` = native bağımlılık hash politikası; JS-only değişiklikler EAS Update kanalı (`production`) ile OTA, kademeli %10 → %50 → %100.
- Mağaza: App Store + Google Play; gizlilik beyanları (veri toplama: hesap bilgisi, kullanım verisi); demo hesap incelemeciler için.
- Kritik hata: OTA geri alma tek komut; native sorun için önceki build'e "republish".

## 6. Sürüm ve değişiklik günlüğü

- SemVer; `CHANGELOG.md` Conventional Commits'ten üretilir (bu repodaki `changelog-generator` skill'i kullanılabilir).
- Her sürüm notu: kullanıcıya görünen değişiklikler (i18n), teknik değişiklikler, migration notları, bilinen sorunlar.

## 7. Rollback

- API/workers: önceki image tag'ine dön (< 2 dk); migration contract adımı uygulanmadıysa DB uyumlu.
- Temporal: workflow kodu sürümleme (`patched()` API) ile çalışan workflow'lar kırılmaz.
- Web: önceki statik build.
- Mobil: OTA geri alma; native için store sürümü.
