# ADR-0011: Dinamik yapılandırma ve "bayat veri yok" ilkesi

- **Durum:** Kabul edildi
- **Tarih:** 2026-09-03

## Bağlam
Platform kotaları (Instagram 100/gün, Threads 250/gün), API fiyatları (X PPU), model adları/fiyatları, yasal metin sürümleri, trend kaynak listesi, şablonlar ve hatta "hangi platform hangi kabiliyeti destekliyor" bilgisi aylar içinde değişiyor. Koda gömülü sabitler sessizce eskir; sistem yanlış kota ile ban yer, yanlış fiyatla zarar eder, eski yasal metinle sorumluluk doğurur.

## Karar
1. **`config` bounded context'i.** Tablolar: `policy_entries(key, scope, value JSONB, version, effective_from, verified_at, source_url, verified_by, notes)`. Örnek anahtarlar: `platform.instagram.publish_limit_24h`, `platform.x.price_per_post_usd`, `llm.writer.model`, `legal.privacy.version`, `trend.sources`. Her okuma `ConfigService.get(key)` üzerinden; koda sabit yazmak lint kuralıyla yasak (`hg/no-magic-platform-constants`).
2. **Sürümleme ve yürürlük.** Yeni değer yeni satır; `effective_from` ile ileri tarihli değişiklik; geçmiş değerler denetim için kalır.
3. **Bayatlık gözcüsü.** Her anahtarın `max_age_days` (ör. platform limiti 30, fiyat 30, model adı 60, yasal metin 180). Temporal cron günde bir tarar; aşılanlar `warning` alarm, iki katı aşılanlar `critical`. Panelde "Doğrula" düğmesi `verified_at`'i günceller.
4. **Kaynağa bağlı otomatik doğrulama.** Mümkün olan anahtarlar için doğrulayıcı activity: Instagram `content_publishing_limit` uç noktası, X fiyat sayfası başlığı hash'i, Anthropic model listesi (`/v1/models`). Değişiklik tespitinde alarm + öneri; otomatik uygulama yalnızca güvenli anahtarlarda (limit **azalması** hemen uygulanır, artışı insan onayı ister).
5. **Önbellek disiplini.** Her `cache.set` TTL zorunlu (tip düzeyinde); anahtar başına geçersizleştirme olayı (`ConfigChanged`, `PersonaUpdated`). İstemci (web/mobil) TanStack Query `staleTime` politikaları merkezi `queryPolicies.ts`'ten; "asla eskimez" değeri yok.
6. **Zaman sönümlü veri.** Trend skorları üstel sönümlü; `signals` 90 gün, `interactions` metni 90 gün sonra anonim; `post_metrics` toplulaştırılır. Saklama süreleri de `config`'te.
7. **Çalışma zamanı sağlık.** `GET /v1/health/config` bayat anahtar sayısını döner; CI'da `config:lint` her anahtarın şeması ve `max_age_days`'i olduğunu doğrular.

## Sonuçlar
Artı: değişen dünyaya kod değişikliği olmadan uyum; denetlenebilirlik; yanlış sabit riski sıfıra iner. Eksi: her sabit için şema ve tohum verisi yazma yükü; küçük çalışma zamanı maliyeti (önbellekli). Reddedilen: env değişkenleri ile yapılandırma (sürümsüz, denetimsiz), koda sabit + yorum.
