# ADR-0010: Yalnızca resmi platform API'leri; hesap açma otomasyonu yok

- **Durum:** Kabul edildi
- **Tarih:** 2026-09-03
- **Karar vericiler:** Proje sahibi + mimari ajan

## Bağlam
Tarayıcı otomasyonu ve hesap açma otomasyonu 6 platformun kullanım şartlarını ihlal eder; ban ve geliştirici hesabı kaybı riski; AB AI Act ve Türkiye reklam mevzuatı şeffaflık ister (bkz. research §2).

## Karar
Adaptörler yalnızca resmi API; hesaplar elle açılır, sistem profil paketini hazırlar; X'te 'Automated' etiketi ve insan onaylı yanıt; sentetik medya ve reklam etiketleri zorunlu alan; TikTok/X için gerektiğinde lisanslı aracı (Zernio/Ayrshare) aynı adaptör arayüzü arkasında.

## Sonuçlar
Artı: sürdürülebilirlik, hukuki güvenlik. Eksi: bazı platformlarda audit bekleme süresi. Reddedilen: Playwright/emülatör tabanlı yayın, userbot, proxy havuzu.
