# Heliograph — Proje Hafızası ve Ana Kurallar

> Heliograph: ışıkla sinyal veren aynalı cihaz. Bu projede: trendi ilk yakalayıp 20 personadan 6 platforma sinyal gönderen, web + mobil yönetim uygulamalı, tam otomatik sosyal medya sistemi.

Bu dosya her oturumda **önce** okunur. Buradaki kurallar, `docs/` altındaki ayrıntılı dokümanların özetidir; çelişki hâlinde `docs/` kazanır, `docs/` içinde çelişki varsa en yüksek numaralı ADR kazanır.

## 0. Doküman haritası (okuma sırası)

| Ne yapacaksam | Önce okunacak |
|---|---|
| Herhangi bir iş | Bu dosya + `docs/README.md` |
| Yeni modül / sınır kararı | `docs/01-mimari.md`, `docs/02-teknoloji-secimleri.md`, `docs/adr/` |
| Kod yazmak | `docs/03-kodlama-kurallari.md` |
| Test yazmak / PR açmak | `docs/04-test-ve-kalite.md` (Definition of Done) |
| API uç noktası eklemek | `docs/05-api-sozlesmesi.md` |
| Metin/çeviri eklemek | `docs/06-i18n.md` |
| UI / ekran / bileşen | `docs/07-tasarim-sistemi.md` |
| Kimlik, token, gizli bilgi | `docs/08-guvenlik.md` |
| Log, metrik, alarm, SLO | `docs/09-gozlemlenebilirlik.md` |
| Pipeline, dağıtım, mağaza | `docs/10-ci-cd-ve-dagitim.md` |
| Şema / migration | `docs/11-veri-modeli.md` |
| Sıradaki iş ne | `docs/12-teknik-yol-haritasi.md` |
| Ürün gerekçesi, platform kuralları, fiyatlar | `../research/sosyal-medya-otomasyon-yol-haritasi.md` |

## 1. Değişmez kurallar (Non-negotiables)

1. **Yalnızca resmi platform API'leri.** Tarayıcı otomasyonu, hesap açma otomasyonu, tespit-atlatma kodu yazılmaz. Kural ihlali isteği gelirse reddedilir ve gerekçe `research/` dokümanına işaret eder.
2. **Modüler monolit, hexagonal.** Her bounded context `domain / application / infrastructure / interface` katmanlarına sahiptir. Domain katmanı hiçbir framework'e (Nest, Drizzle, Temporal) import vermez. Modüller arası çağrı yalnızca `application` katmanındaki public servisler veya outbox üzerinden domain event ile olur. Sınır ihlali `dependency-cruiser` ile CI'da kırılır.
3. **Her kapı testli.** Domain: birim testi zorunlu, satır kapsamı ≥ %90, mutasyon skoru ≥ %70. Application/infrastructure: entegrasyon testi (Testcontainers Postgres/Redis/Temporal). Interface: contract testi (OpenAPI şeması ↔ gerçek yanıt). UI: bileşen testi + Storybook story + erişilebilirlik (axe, sıfır ihlal). Kritik akışlar: e2e (Playwright web, Maestro mobil). Test olmayan kod merge edilmez.
4. **Her liste sayfalı.** Tüm koleksiyon uç noktaları **opaque cursor** sayfalama kullanır (`?cursor=&limit=`), offset yasak. Varsayılan `limit=25`, maksimum `100`. UI'da sonsuz kaydırma veya "daha fazla" düğmesi; asla tüm listeyi çekme.
5. **Çoklu dil ilk günden.** UI'da ham string yok; her metin bir mesaj kimliğidir (ICU MessageFormat). Yeni dil = `packages/i18n/locales/<bcp47>/` klasörü + `locales.ts`'e bir satır. Tarih, sayı, para, çoğul, liste, göreli zaman `Intl` üzerinden. Tasarım RTL'e hazır (`start/end`, `padding-inline`).
6. **API-first, contract-first.** Uç nokta önce `packages/contracts` içinde Zod şeması + OpenAPI olarak tanımlanır; web ve mobil istemciler bu şemadan üretilen tipli istemciyi kullanır. Hata gövdesi RFC 9457 Problem Details.
7. **Idempotent ve dayanıklı.** Dış etkisi olan her işlem (yayın, DM, ödeme alarmı) `Idempotency-Key` ile ve Temporal workflow içinde yapılır. Retry güvenli olmayan kod yazılmaz.
8. **Gizli bilgi koda ve loga girmez.** OAuth token'ları KMS/Vault ile şifreli saklanır, loglarda maskelenir. `.env` yalnızca yerel; CI/CD gizli bilgi yöneticisinden. `gitleaks` CI'da zorunlu.
9. **Erişilebilirlik ve performans kapıları.** Web: Lighthouse ≥ 95 (perf/a11y/best/SEO), WCAG 2.2 AA, klavye ile tam kullanım. Mobil: 60 fps liste kaydırma, soğuk açılış < 2 sn (orta seviye cihaz). Bundle bütçeleri aşılınca CI kırmızı.
10. **Kalite kapısı olmadan yayın yok.** İçerik üretim hattı `quality` modülünün kapısını geçmeden `publish` çağrılamaz; bu, tip düzeyinde zorlanır (`ApprovedContent` markalı tip).
11. **Şeffaflık.** Reklam/iş birliği içeriklerinde etiket zorunlu alan; sentetik yüz/ses içeren varlıklarda AI beyanı otomatik. Bu alanlar kullanıcı tarafından kapatılamaz.
12. **Kararlar yazılır.** Mimari veya teknoloji kararı = `docs/adr/NNNN-baslik.md`. Kod yorumu ile karar verilmez.

## 2. Çalışma protokolü (ajan için)

- **Önce oku, sonra yaz.** Bir dosyaya dokunmadan önce ilgili doküman ve modülün `README.md`'si okunur.
- **Küçük, tam dilimler.** Her iş: şema → contract → domain → application → infrastructure → interface → UI → test → doküman. Yarım dilim bırakılmaz.
- **Definition of Done** (`docs/04-test-ve-kalite.md` §9) sağlanmadan iş "bitti" denmez.
- **Adlandırma dili:** kod, tanımlayıcılar, commit mesajları, ADR başlıkları **İngilizce**; kullanıcıya görünen metinler i18n kataloğunda (varsayılan `tr`, ikinci `en`).
- **Commit:** Conventional Commits (`feat(content): ...`, `fix(api): ...`, `docs(adr): ...`). Bir commit bir amaç.
- **PR:** şablon doldurulur; ekran görüntüsü/kayıt UI değişikliklerinde zorunlu; kapsam ve mutasyon raporu otomatik yorum olarak düşer.
- **Belirsizlik:** varsayım yapıp ilerle, varsayımı PR açıklamasına yaz; yalnızca geri alınamaz veya para/hukuk etkili kararlarda dur ve sor.
- **Hafıza:** Öğrenilen her kalıcı bilgi (platform kotası değişti, kütüphane sürümü atladı, bir kural işe yaramadı) ilgili `docs/` dosyasına işlenir; sohbet geçmişine güvenilmez.

## 3. Monorepo yerleşimi (özet)

```
heliograph/
  apps/web          Next.js yönetim paneli
  apps/mobile       Expo (iOS/Android) yönetim uygulaması
  apps/api          NestJS modüler monolit (HTTP + webhook)
  apps/workers      Temporal worker'ları (içerik, medya, etkileşim, trend)
  packages/domain   Saf TypeScript bounded context'ler (framework yok)
  packages/contracts Zod şemaları + OpenAPI + üretilmiş istemciler
  packages/ui       Evrensel tasarım sistemi (web + RN), token'lar, ikonlar
  packages/i18n     Mesaj katalogları, Intl yardımcıları
  packages/adapters Platform sürücüleri (instagram, threads, tiktok, youtube, x, telegram)
  packages/config   tsconfig, biome, dependency-cruiser, vitest ortak ayarları
  docs/             Bu dokümanlar + ADR'ler
  tooling/          Codegen, seed, mock sunucu, yük testi
```

## 4. Hızlı komutlar

```
pnpm i                      # kurulum
pnpm dev                    # web + api + workers (Temporal dev server, Postgres, Redis docker-compose ile)
pnpm dev:mobile             # Expo dev client
pnpm test                   # birim + entegrasyon
pnpm test:e2e               # Playwright
pnpm test:mobile            # Maestro akışları
pnpm lint && pnpm typecheck # Biome + tsc --noEmit
pnpm check                  # lint + typecheck + test + boundaries + knip + i18n:check
pnpm contracts:gen          # OpenAPI ve istemci üretimi
pnpm i18n:extract           # mesaj çıkarımı, eksik çeviri raporu
pnpm db:migrate             # Drizzle migration
```
