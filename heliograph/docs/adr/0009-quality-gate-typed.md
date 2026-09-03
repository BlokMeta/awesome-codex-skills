# ADR-0009: Kalite kapısı tip düzeyinde zorlama

- **Durum:** Kabul edildi
- **Tarih:** 2026-09-03
- **Karar vericiler:** Proje sahibi + mimari ajan

## Bağlam
Kapı atlanarak yayın yapılması en büyük ürün riski. Çalışma zamanı kontrolü unutulabilir.

## Karar
`publishing` yalnızca `ApprovedContent` markalı tipini kabul eder; bu tip yalnızca `quality` modülünün `GateRunner` çıktısından üretilebilir (private constructor + brand). Reklam/AI etiket alanları aynı tipte zorunlu.

## Sonuçlar
Artı: derleme zamanında güvence, test edilebilir. Eksi: küçük tip karmaşıklığı. Reddedilen: yalnızca çalışma zamanı kontrolü.
