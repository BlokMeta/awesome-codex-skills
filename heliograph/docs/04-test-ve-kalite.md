# 04 — Test Stratejisi ve Kalite Kapıları

Hedef: Her değişiklik, üretime çıkmadan önce **otomatik** olarak "10/10" kapı setinden geçer. İnsan incelemesi tasarım ve niyet içindir, hata yakalamak için değil.

## 1. Test piramidi (oranlar hedef)

| Katman | Araç | Kapsam | Hız | Oran |
|---|---|---|---|---|
| Birim (domain, saf fonksiyonlar, hook'lar) | Vitest (+ fast-check property-based) | %90 satır, %85 dal | ms | %65 |
| Bileşen (UI) | Vitest + Testing Library (web), RNTL (mobil) + Storybook interaction tests | Her public bileşen | ms–s | %15 |
| Entegrasyon (application + infrastructure) | Vitest + Testcontainers (Postgres, Redis), Temporal test env | Her use-case, her repository | s | %12 |
| Contract | OpenAPI şeması ↔ gerçek yanıt (Spectral + schema assert), adapter ↔ platform sandbox kayıtları (recorded fixtures) | Her uç nokta, her adaptör | s | %5 |
| E2E | Playwright (web), Maestro (mobil) | 12 kritik akış | dk | %3 |

## 2. Ne test edilir, ne edilmez

- Test edilir: davranış (girdi → çıktı/olay), sınır değerler, hata yolları, idempotency, zaman/dilim davranışı, kota/limit, i18n çoğul/tarih, erişilebilirlik.
- Test edilmez: framework'ün kendisi, getter/setter, mock'un mock'u.
- Snapshot testi yalnızca render edilmiş Problem Details ve e-posta şablonları gibi kararlı çıktılar için; UI snapshot yasak (kırılgan).

## 3. Mock ve sahte veri politikası

| Sınır | Araç | Kural |
|---|---|---|
| HTTP (istemci tarafı) | **MSW 2** (web, RN, Node) | Tek handler seti `tooling/mocks/handlers/*`; Storybook, Vitest, Playwright, Expo dev aynı handler'ları kullanır |
| Dış platform API'leri (adaptör testleri) | Kaydedilmiş fixture'lar (`packages/adapters/<p>/fixtures/*.json`) + MSW | Gerçek API'ye test asla gitmez; fixture'lar sandbox hesaptan elle yenilenir, tarih damgalı |
| OpenAPI tabanlı mock sunucu | Prism (`tooling/mocks/prism`) | Frontend, backend hazır olmadan contract'tan çalışır |
| LLM | `FakeLlmWriter` (deterministik, senaryo tabanlı) | Gerçek model yalnızca `test:llm-eval` (ayrı, ücretli, gece) |
| Zaman/rastgelelik | `FakeClock`, `SeededRng` | Domain'de doğrudan kullanılmaz |
| Sahte veri | `@faker-js/faker` + `tooling/seed` fabrikaları (`aPersona()`, `aBrief()`) | Fabrika olmadan elle nesne kurmak yasak |

## 4. Kalite kapıları (CI'da sıra)

| # | Kapı | Araç | Eşik |
|---|---|---|---|
| 1 | Format + lint | Biome | 0 hata, 0 uyarı |
| 2 | Tip | `tsc --noEmit` (project references) | 0 |
| 3 | Sınırlar | dependency-cruiser | 0 ihlal |
| 4 | Ölü kod / bağımlılık | knip, syncpack | 0 |
| 5 | i18n | `i18n:check` (eksik/kullanılmayan mesaj) | 0 eksik tüm dillerde |
| 6 | Birim + bileşen | Vitest | kapsam eşikleri paket başına `vitest.config` |
| 7 | Mutasyon (domain) | Stryker | ≥ %70 (haftalık, main) |
| 8 | Entegrasyon | Vitest + Testcontainers | yeşil |
| 9 | Contract | Spectral (OpenAPI lint) + schema assert | 0 |
| 10 | Güvenlik | gitleaks, Semgrep, `pnpm audit --prod`, Trivy (image), CodeQL | 0 yüksek/kritik |
| 11 | E2E web | Playwright (Chromium + WebKit) | yeşil, flaky quarantine yasak |
| 12 | E2E mobil | Maestro (iOS sim + Android emu, EAS) | yeşil |
| 13 | Erişilebilirlik | axe (Playwright + Storybook) | 0 ihlal |
| 14 | Performans | unlighthouse / lighthouse (≥ 95 dört kategori; Lighthouse CI bakımsız), bundle-size (`size-limit`) | bütçe aşımı kırmızı |
| 15 | Görsel regresyon | Storybook + Playwright screenshot (argos veya kendi diff) | fark = inceleme |
| 16 | Migration güvenliği | `db:migrate` boş DB + son prod dump'ında; geri alma testi | yeşil |
| 17 | Yük (haftalık) | k6: `/review-tasks` 200 rps p95 < 300 ms; publish workflow 100/dk | SLO |

## 5. Test yazım kuralları

- İsim: `describe('<Birim>') → it('<koşul> olduğunda <sonuç>')`, İngilizce.
- AAA (Arrange-Act-Assert), tek assert konusu; fabrikalar ile kurulum.
- Test verisi anlamlı (persona adı "Deniz", "x" değil).
- Async testte sahte zaman (`vi.useFakeTimers` / Temporal `TestWorkflowEnvironment` time-skipping).
- Flaky test = bug; `retry` ile örtülmez, kök neden düzeltilir.
- Her hata düzeltmesi önce başarısız test ile gelir.

## 6. E2E kritik akışlar (12)

1. Giriş + 2FA
2. Persona sihirbazı → Başlat (Telegram kanalı ile gerçek yayın; test kanalı)
3. Kanal OAuth bağlama (mock OAuth sunucusu)
4. Trend listesinden manuel brief oluşturma
5. Onay kuyruğu: önizleme, düzenle, onayla → takvimde görünür
6. Onay kuyruğu: reddet → yeniden üretim tetiklenir
7. Takvimde sürükle-bırak yeniden zamanlama
8. Inbox: yorum yanıtı taslak → gönder
9. Para eşiği alarmı → mobilde push → eskalasyon ekranı
10. Fırsat (deal) aşaması değiştirme + medya kiti indirme
11. Medya kütüphanesi yükleme + gün aşırı plan
12. Dil değiştirme (tr ↔ en) tüm ekranlarda ham string yok

## 7. Mobil'e özel

- RNTL ile bileşen; Maestro `.yaml` akışları `apps/mobile/e2e/`.
- Cihaz matrisi: iPhone 13 (iOS son-1), Pixel 6 (Android son-1), küçük ekran (iPhone SE).
- Offline senaryosu: uçak modu → onay ver → çevrimiçi → tek istek gitti (idempotency).
- Performans: Flashlight veya `react-native-performance` ile TTI ve JS FPS ölçümü CI'da.

## 8. LLM kalite değerlendirmesi (ayrı hat)

- `tooling/evals/`: her prompt sürümü için 50–200 örnekli değerlendirme seti (persona uyumu, AI-kokusu rubriği, doğruluk).
- Gece çalışır, skor düşerse PR'a yorum. Prompt değişikliği eval olmadan merge edilmez.

## 9. Definition of Done

Bir iş "bitti" sayılır, ancak:

- [ ] Contract güncel ve üretilmiş istemci commit'li
- [ ] Domain birim testleri + application entegrasyon testleri yazıldı ve geçti
- [ ] UI değişikliği: story + bileşen testi + axe temiz + ekran görüntüsü PR'da
- [ ] i18n: `tr` ve `en` mesajları eklendi, `i18n:check` temiz
- [ ] Sayfalama/idempotency/log/metrik gereksinimleri karşılandı
- [ ] Modül `README.md` ve gerekiyorsa ADR güncellendi
- [ ] `pnpm check` yerelde yeşil; CI 17 kapı yeşil
- [ ] Yol haritasında ilgili madde işaretlendi
