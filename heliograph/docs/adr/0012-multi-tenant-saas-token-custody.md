# ADR-0012: Çok kiracılı SaaS, paylaşımlı platform uygulamaları ve token emaneti

- **Durum:** Kabul edildi
- **Tarih:** 2026-09-03

## Bağlam
Ürün yalnızca sahibin hesapları için değil; her kullanıcı kaydolup kendi hesaplarını bağlayacak ve ücret ödeyecek. Bu, (a) platform geliştirici uygulamalarımızın **üçüncü taraf hesaplara** hizmet vermesi (Meta Advanced Access + Business Verification, Google OAuth doğrulaması, TikTok audit), (b) kullanıcı token'larının bizde şifreli tutulması, (c) plan haklarının ölçülmesi ve faturalanması, (d) kiracı izolasyonu anlamına gelir.

## Karar
1. **Kiracı modeli.** `workspace` = müşteri (bireysel veya ekip). `operator` = kullanıcı; bir kullanıcı birden çok workspace'e üye olabilir (`memberships` rol ile). Tüm veri `workspace_id` ile RLS; süper yönetici ayrı rol ve ayrı panel (`/admin`, `admin` context'i).
2. **Paylaşımlı platform uygulamaları.** Instagram/Threads/TikTok/YouTube/X için **tek** geliştirici uygulaması bize ait; kullanıcı OAuth ile kendi hesabını bu uygulamaya yetkilendirir. Telegram'da kullanıcı kendi botunu BotFather'dan alıp token'ı girer (Telegram'da paylaşımlı bot mümkün değil). Platform app review'ları operatörün sorumluluğu (`docs/14`).
3. **Token emaneti.** Kullanıcı token'ları zarf şifreleme ile (`credentials` tablosu, ADR-0007 + docs/08); kullanıcı bağlantıyı kaldırınca token iptal edilir (platform revoke uç noktası çağrılır) ve silinir; hesap silme tüm token'ları ve içerikleri 30 gün içinde yok eder; Meta **Data Deletion Callback** uç noktası uygulanır.
4. **Plan hakları (entitlements).** `plans` → `entitlements` (bağlı hesap sayısı, günlük post/video, AI kredisi, persona sayısı, ekip üyesi, özellik bayrakları). Her maliyetli use-case önce `EntitlementService.assert(workspace, feature, amount)`; sonra `usage_records` yazar. Haklar `config` ile dinamik (ADR-0011).
5. **Faturalama.** Web-öncelikli satın alma (MoR sağlayıcı, ADR-0013); mobil uygulama hakları okur, satın alma akışını mağaza kurallarına göre gösterir/gizler. Fatura, KDV ve mesafeli satış belgeleri `billing` context'inde.
6. **Kiracı başına bütçe.** `budgets` workspace bazlı; sahibin kendi hesapları da bir workspace'tir (ayrıcalık yok; "internal" plan).
7. **Kanıt.** Her use-case testinde "başka workspace'in verisine erişemez" senaryosu; RLS testi Testcontainers ile.

## Sonuçlar
Artı: tek ürün, tek altyapı; sahibin kullanımı gerçek müşteri deneyimidir. Eksi: app review süreçleri zorunlu ve daha ağır (Business Verification), destek/abuse yükü, yasal yükümlülükler (docs/16). Reddedilen: kullanıcı başına ayrı geliştirici uygulaması (ölçeklenmez), token'ları istemcide tutmak (arka plan otomasyonu imkânsız).
