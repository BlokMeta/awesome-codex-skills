# ADR-0014: Kiracı izolasyonu `SET LOCAL ROLE hg_app` ile; entegrasyon testleri PGlite + gerçek Postgres

- **Durum:** Kabul edildi
- **Tarih:** 2026-09-04

## Bağlam
Kural 14 her satırda RLS ister ve çapraz kiracı erişiminin testle kanıtlanmasını şart koşar. Postgres'te RLS, tablo sahibine ve superuser'a uygulanmaz; yönetilen Postgres servislerinde (Neon, Supabase, RDS) uygulamanın bağlandığı rol çoğu zaman tabloların sahibidir. Ayrıca kural 3 "Testcontainers" der; ancak Docker'ın olmadığı ortamlarda (bu geliştirme kabı dahil) entegrasyon testleri çalışmaz ve geri bildirim döngüsü kopar.

## Karar
1. **Runtime rolü:** İlk migration `hg_app` adlı NOLOGIN, NOBYPASSRLS bir rol yaratır (idempotent, `pg_advisory_xact_lock` ile yarış-güvenli) ve bağlanan role `GRANT hg_app` verir. Tüm kiracı politikaları `TO hg_app` bağlıdır. Yeni tablolar için `ALTER DEFAULT PRIVILEGES` ile GRANT otomatiktir.
2. **Tek giriş kapısı:** Kiracı kapsamındaki her okuma/yazma `withWorkspace(db, workspaceId, fn)` içinden geçer; bu fonksiyon bir transaction açar, `SET LOCAL ROLE hg_app` ve `SET LOCAL hg.workspace_id = '<id>'` çalıştırır. `SET LOCAL` transaction sonunda otomatik geri alınır; havuzdaki bağlantı kiracı taşımaz. Kiracılar arası meşru işlemler (`listForOperator`, bayatlık gözcüsü, yönetim) `withoutTenant(db, reason, fn)` ile yapılır; `reason` zorunludur ki her çağrı yeri incelenebilsin.
3. **Şema sözleşmesi testi:** `apps/api/src/db/schema.test.ts` `workspace_id` kolonu olan her tabloda `enableRLS()` + `hg_app`'e bağlı en az bir politika ister; eksikse CI kırmızı.
4. **Entegrasyon test veritabanı:** `HG_TEST_DATABASE_URL` verilmişse her test dosyası kendi geçici veritabanını yaratır (gerçek Postgres 16; CI'da `services: postgres`). Verilmemişse süreç içi **PGlite** (Postgres'in WASM derlemesi; roller, RLS, JSONB, transaction aynı) kullanılır. Aynı test dosyaları iki modda da çalışır; Testcontainers yalnızca Redis/Temporal için M1'de eklenir.
5. **Migration üretimi:** `drizzle-kit generate` çıktısı `apps/api/drizzle/` altında commit'lenir; CI, şema ile migration'ın uyuştuğunu (`git status --porcelain apps/api/drizzle` boş) doğrular. RLS/rol SQL'i ilk migration'ın başında ve sonunda elle eklenmiştir; sonraki migration'lar drizzle-kit politikalarını üretir.

## Sonuçlar
Artı: RLS, uygulamanın hangi rolle bağlandığından bağımsız olarak **her zaman** devrede; izolasyon üç katmanlı (`withWorkspace` filtre + RLS + şema testi); entegrasyon testleri infra gerektirmeden 5 sn'de koşar; CI gerçek Postgres'te tekrar eder. Eksi: PGlite tek bağlantılıdır (eşzamanlılık hataları orada görünmez; CI'daki gerçek Postgres yakalar); `SET LOCAL` her transaction'a iki round-trip ekler (ölçüldü, önemsiz). Reddedilen: tabloları ayrı bir sahibe verip uygulamayı hep `hg_app` ile bağlamak (yönetilen servislerde rol yönetimi zahmetli, yerelde iki URL); uygulama katmanında yalnızca `WHERE workspace_id` (RLS olmadan kural 14 karşılanmaz); SQLite/bellek içi test çiftleri (Postgres semantiği farklı).
