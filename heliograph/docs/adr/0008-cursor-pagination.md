# ADR-0008: Tüm listelerde opaque cursor sayfalama

- **Durum:** Kabul edildi
- **Tarih:** 2026-09-03
- **Karar vericiler:** Proje sahibi + mimari ajan

## Bağlam
Offset sayfalama büyük tablolarda yavaşlar ve ekleme/silme sırasında kayma yapar; mobil sonsuz kaydırma tutarlı cursor ister.

## Karar
Her koleksiyon uç noktası `limit` + opaque `cursor` (base64url {k,id,v}); toplam sayı verilmez; sıralama yalnızca indeksli anahtarlarda; UI'da sanallaştırılmış liste.

## Sonuçlar
Artı: sabit performans, tutarlılık. Eksi: 'sayfa 7'ye git' yok (ürün gereksinimi değil). Reddedilen: offset/limit, keyset olmayan cursor.
