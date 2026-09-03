# ADR-0004: ORM olarak Drizzle, tek Postgres + pgvector

- **Durum:** Kabul edildi
- **Tarih:** 2026-09-03
- **Karar vericiler:** Proje sahibi + mimari ajan

## Bağlam
Gömme vektörleri (dedup, benzerlik), outbox, ilişkisel veri aynı işlemde gerekiyor. Prisma 7 pgvector'ü Unsupported tipiyle destekliyor; Prisma 8 henüz RC.

## Karar
Drizzle ORM 0.45 (1.0 RC izlenir), drizzle-kit migration'ları incelenerek commit edilir; pgvector HNSW indeksleri; ayrı vektör DB yok.

## Sonuçlar
Artı: yerel vector() tipi, SQL'e yakınlık, tek DB. Eksi: drizzle-kit rename tespiti zayıf (migration'lar elle incelenir). Reddedilen: Prisma 7, Qdrant/Pinecone.
