# ADR-0002: İş akışı motoru olarak Temporal

- **Durum:** Kabul edildi
- **Tarih:** 2026-09-03
- **Karar vericiler:** Proje sahibi + mimari ajan

## Bağlam
Video üretimi 6–8 adımlı, dakikalar süren, kısmen başarısız olabilen süreç; yayın zamanlaması, token yenileme, metrik toplama zamanlayıcıları var. Basit kuyruklar (BullMQ) adım durumu ve deterministik tekrar oynatma vermiyor.

## Karar
Temporal (TS SDK 1.23) self-host ile başla; workflow başına ayrı task queue; activity'ler idempotent; Testcontainers ile test.

## Sonuçlar
Artı: retry/timeout/zamanlayıcı/görünürlük hazır; workflow sürümleme. Eksi: ek servis, öğrenme eğrisi, workflow kodunda determinizm kısıtı. Reddedilen: BullMQ, Inngest, Trigger.dev, cron+DB.
