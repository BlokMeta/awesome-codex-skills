# ADR-0013: Faturalama — MoR (web) + mağaza içi satın alma, haklar tek kaynaktan

- **Durum:** Kabul edildi
- **Tarih:** 2026-09-03

## Bağlam
Şirket Türkiye'de; Stripe Türkiye'de kurulu işletmelere hesap açmıyor (stripe.com/global). Küresel KDV/satış vergisi yükü bir Merchant of Record ile çözülmeli. Apple 3.1.3(b) uyarınca web'de satın alınan hakların uygulamada kullanılabilmesi için aynı planların uygulama içi satın alma olarak da sunulması gerekiyor; Google Play 30 Haz 2026'dan itibaren ABD/AEA/İngiltere'de web link-out'a %10 ile izin veriyor. Türkiye'de yerleşik müşteriye TL fiyat zorunlu (32 sayılı Karar Tebliği md. 8).

## Karar
1. `PaymentProvider` portu; adaptörler: **Paddle** (canlıya çıkış), **Polar** (ikinci MoR, kredi/kullanım faturalama; 6 ay sonra birincil yeniden değerlendirilir), **iyzico Abonelik** (TRY; MoR TRY satamıyorsa lansmanda, aksi hâlde faz 2), **RevenueCat** (App Store + Play IAP).
2. Haklar tek kaynaktan: `subscriptions` + `plan_entitlements` + `credit_ledger`; sağlayıcı webhook'ları yalnızca bu tabloları günceller; uygulamalar `GET /v1/billing/entitlements` okur.
3. Mobilde aynı planlar IAP olarak listelenir (Small Business Program %15). ABD vitrininde web link-out gösterilir; diğer vitrinlerde web fiyatı anılmaz (Apple kuralı). Android'de ABD/AEA/İngiltere'de web link-out %10 ile açılır. Ülke bazlı davranış `config`'te (`billing.store_policy.<country>`).
4. Faturalar: MoR satışlarında MoR düzenler; iyzico satışlarında e-Arşiv bizden; MoR'a aylık toplu fatura (SMMM ile).
5. Deneme: 7 gün kartlı Creator (A/B: kartsız Free'ye düşüş). İptal tek tık; yıllıkta yenilemeden 15 gün önce hatırlatma (docs/16 §4).
6. Vergi/şirket: Limited Şirket; hizmet ihracı KDV istisnası ve yazılım ihracatı kazanç istisnası SMMM görüşüyle; ETBİS kaydı; 10962 sayılı Karar desteğine başvuru.

## Sonuçlar
Artı: Stripe olmadan küresel satış, vergi yükü MoR'da, mağaza kurallarıyla uyum, sağlayıcı değişimi ucuz. Eksi: MoR komisyonu (%5 + 0,50 $), IAP satışlarında %15, iki MoR bakımı. Reddedilen: Stripe Atlas + ABD LLC (çift şirket, vergi karmaşıklığı; ileride opsiyon), Lemon Squeezy (doğrulama süresi ve belirsiz gelecek), yalnızca IAP (web marjı kaybı), yalnızca web (Apple 3.1.3(b) riski).
