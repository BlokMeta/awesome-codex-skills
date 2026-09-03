# 07 — Tasarım Sistemi ve Ürün Deneyimi

## 1. Kimlik: "Işıkla sinyal"

Heliograph, aynayla güneş ışığını yansıtarak uzağa mesaj gönderen cihazdır. Ürünün görsel dili buradan türer: **koyu ufuk üzerinde tek, kesin bir parıltı**. Ekranların çoğu sakin, mat ve gri-yeşil tonlarda; dikkat gerektiren tek şey (canlı yayın, alarm, onay bekleyen iş) "flaş" sarısıyla yanar. Her yerde parlayan bir arayüz değil, **tek yerde parlayan** bir arayüz.

Kaçınılanlar (yaygın AI-görünümlü kalıplar): krem zemin + serif + terracotta; siyah zemin + tek asit yeşili; mor-mavi gradyan hero; her bloğu kart yapmak; her şeyi ortalamak; emoji başlıklar; Inter/Space Grotesk varsayılanı; `rounded-lg` her yerde.

## 2. Token'lar (tek kaynak: `packages/ui/tokens/*.json`, Style Dictionary ile CSS değişkeni + RN nesnesi üretilir)

### 2.1 Renk

| Token | Açık | Koyu | Rol |
|---|---|---|---|
| `ground` | `#F4F5F1` (tuz; yeşil-gri eğilimli soğuk beyaz) | `#0E1213` (gece denizi) | Sayfa zemini |
| `surface` | `#FFFFFF` | `#161B1C` | Paneller, satırlar |
| `surface-2` | `#EBEEE9` | `#1E2426` | Girintili alanlar, kod |
| `ink` | `#1A1D1B` | `#E8EBE6` | Birincil metin |
| `ink-2` | `#4B514D` | `#AEB6B0` | İkincil metin |
| `ink-3` | `#7C837E` | `#7C837E` | Etiket, yer tutucu |
| `line` | `#D8DCD6` | `#263030` | Ayırıcı |
| `tide` | `#1F4E5A` | `#7FC1CF` | Birincil eylem, bağlantı, seçili durum |
| `tide-soft` | `#DCE9EC` | `#12343C` | Seçili satır zemini |
| `flash` | `#F2B705` | `#FFC933` | **Yalnızca** canlı/dikkat: onay bekleyen sayacı, canlı yayın noktası, alarm çubuğu |
| `flash-ink` | `#3F2F00` | `#0E1213` | Flaş üzerindeki metin |
| `good` | `#2F855A` | `#5CC48C` | Sağlıklı, yayınlandı |
| `warn` | `#B9730A` | `#E3A33B` | Kota yaklaşıyor, token süresi |
| `critical` | `#B83A31` | `#F07A70` | Ban riski, para eşiği, hata |

Kural: `flash` bir ekranda en fazla iki yerde. Semantik renkler aksan değildir. Gri tonları saf gri değil, yeşil-gri eğilimli.

### 2.2 Tipografi

| Rol | Yazı tipi | Not |
|---|---|---|
| Başlık | **Bricolage Grotesque** (değişken, optik boyut) | Karakterli, geniş; 600–700; büyük boyutta `opsz` ile daralır |
| Gövde/UI | **Instrument Sans** | Nötr ama Inter değil; 400/500/600; Türkçe diakritikleri tam |
| Veri/kod | **JetBrains Mono** | Tablolar, kotalar, cursor, zaman damgaları; `tabular-nums` |

Ölçek (px, satır yüksekliği): 12/16 · 13/18 · 14/20 · 16/24 · 18/26 · 22/28 · 28/34 · 36/40 · 48/52. Başlıklarda `text-wrap: balance`. Etiketler 12px, büyük harf, `letter-spacing: .06em`, mono.

RN'de aynı aileler `expo-font` ile paketlenir; ölçek aynı, satır yüksekliği aynı.

### 2.3 Boşluk, kenar, yükseklik

- Boşluk ölçeği: 2 4 8 12 16 24 32 48 64.
- Köşe: `0` (satırlar, tablolar), `4` (giriş alanları, düğmeler), `8` (önizleme kartları, sheet). `9999` yalnızca rozet/avatar.
- Gölge: yalnızca kaldırılan katmanlarda (popover, sheet, sürüklenen öğe). Statik panel gölge almaz; ayırıcı çizgi kullanır.
- Yoğunluk: veri yoğun tablolar 36px satır; inbox 56px; onay kartları içerik kadar.

### 2.4 Hareket

- Süreler: 120 ms (durum), 200 ms (panel), 320 ms (sheet). Eğri `cubic-bezier(.2,.8,.2,1)`.
- **Flaş darbesi**: canlı bir şey olduğunda (yeni onay, yayın anı) ilgili öğe bir kez `flash` ile 320 ms yanar, sonra söner. Sürekli animasyon yok.
- `prefers-reduced-motion`: darbe yerine anlık renk; sheet'ler kaydırmasız.
- Mobil: haptic (hafif) onay/red'de; başarıda "tık", hatada "iki tık".

## 3. İmza bileşenler (yalnızca bu üründe olan)

| Bileşen | Ne yapar |
|---|---|
| **Ufuk şeridi (HorizonStrip)** | 24 saatlik yatay şerit; her persona/kanal için planlanan yayınlar küçük ışık tikleri, yayınlananlar dolu, başarısızlar kırmızı. Panel ana ekranının üstünde durur; takvimin sıkıştırılmış hâli. |
| **Sinyal günlüğü (SignalLog)** | Haftalık rapor "log" biçiminde: mono, zaman damgalı, satır satır; "en iyi 5 / en kötü 5" işaretli. Grafik yerine okunur kayıt. |
| **Kapı raporu (GateReport)** | Kalite kapısının 8 katmanı yatay bir hat üzerinde; geçen katman dolu nokta, düşen katman açık; tıklayınca gerekçe. Onay ekranının kalbi. |
| **Persona takımyıldızı (ConstellationRail)** | Sol rayda personalar, her biri 6 kanal noktasıyla (sağlık rengi). 20 persona × 6 nokta tek bakışta. |
| **Sıcaklık etiketi (TrendHeat)** | Trend listesinde skoru rakamla değil, hızla dolan ince bir çubuk ve "ilk görülme: 14 dk önce" ile gösterir. |
| **Para eşiği kartı (MoneyLine)** | Kırmızı üst çizgili tek kart; teklifin özü, marka, tahmini değer, "Ben devralıyorum" düğmesi. Sistem burada asla yanıt taslağı önermez. |

## 4. Web bilgi mimarisi

```
┌ ConstellationRail ┬────────────── Çalışma alanı ───────────────┬ Inspector ┐
│ ● Deniz  ●●●●●●   │ HorizonStrip (bugün)                        │ seçili    │
│ ● Ayşe   ●●●●○●   │ ──────────────────────────────────────────  │ öğenin    │
│ ● …      ●●●●●●   │ [Kuyruk 7 ⚡] [Takvim] [Trendler] [Inbox 12] │ ayrıntısı,│
│                   │ [Fırsatlar 2] [Kütüphane] [Analitik]        │ eylemleri │
│ + Persona         │                                              │           │
│ ⚙ Ayarlar         │  içerik listesi / takvim / …                 │           │
└───────────────────┴──────────────────────────────────────────────┴───────────┘
```

- Üç sütun; sağ inspector kapatılabilir; 1100px altında tek sütun + üst sekmeler.
- Komut paleti (`⌘K`): persona'ya git, brief oluştur, dil değiştir, "şu haberi 5 persona işlesin".
- Klavye: `j/k` gezinme, `a` onayla, `r` reddet, `e` düzenle, `?` kısayollar. Her eylem klavyeyle.
- Boş durumlar öğretici: "Henüz trend yok. Kaynaklar 5 dakikada bir taranır; ilk sonuçlar ~10 dk." (i18n).
- Yükleme: iskelet satırlar, 200 ms'den kısa isteklerde iskelet gösterilmez (titreme yok).

### 4.1 Ana ekranlar ve akışlar

| Ekran | İş | Kritik detay |
|---|---|---|
| Bugün | HorizonStrip + onay bekleyenler + alarmlar + maliyet sayacı | Flaş yalnızca "onay bekleyen" sayacında |
| Persona sihirbazı | 6 adım: kimlik → ses kitabı (AI taslak, düzenlenebilir örneklerle) → görsel kit (renk/font/avatar önizleme) → kanallar (OAuth, kabiliyet matrisi gri/yeşil) → politika (günlük sayı kaydırıcıları, saat pencereleri, yanıt oranı, onay modu) → önizleme + Başlat | Her adım kaydedilir; yarım bırakılabilir |
| Kuyruk (onay) | Sol liste, orta önizleme (video oynatıcı 9:16, carousel kaydırma, X kartı, Threads görünümü), sağ GateReport + düzenleme | Toplu onay; "yeniden üret: şu notla" |
| Takvim | Hafta/ay; sürükle-bırak; persona/kanal filtre; saat dilimi anahtarı | Çakışma uyarısı (aynı persona 20 dk içinde iki post) |
| Trendler | TrendHeat listesi, küme detayı (kaynaklar), "brief oluştur → hangi personalar" | Konu profili düzenleme yan panelde |
| Inbox | Yorum/DM/e-posta birleşik; sınıflandırma etiketi; otomatik yanıt logu; "insan gerekli" | Yanıt taslağı persona sesiyle; gönder/düzenle |
| Fırsatlar | Kanban (lead → won/lost), medya kiti önizleme, rate card | MoneyLine kartı; sistem fiyat söylemez |
| Kütüphane | Kendi medyanız; etiket; gün aşırı plan kurucu | Kullanım sayacı, "en son ne zaman" |
| Analitik | SignalLog + az sayıda grafik (izlenme eğrisi, format kırılımı, saat ısı haritası) | Sayı kutuları en fazla 4 |
| Ayarlar | Sağlayıcı anahtarları (maskeli), bütçeler (günlük $ kesici), bildirim kanalları, diller, denetim izi | Anahtar test düğmesi ("bağlantıyı dene") |

## 5. Mobil bilgi mimarisi

Alt sekmeler: **Bugün · Kuyruk · Inbox · Fırsatlar · Daha**

- **Bugün:** onay bekleyen sayısı (flaş), alarmlar (kritik üstte), HorizonStrip'in dikey mini hâli, maliyet.
- **Kuyruk:** tam ekran önizleme; sağa kaydır = onayla, sola = reddet; alttan çekilen GateReport; "düzenle" küçük düzeltmeler için; 5 saniyelik geri al.
- **Inbox:** liste → sohbet görünümü; yanıt önerisi tek dokunuşla; "insan gerekli" filtresi.
- **Fırsatlar:** MoneyLine kartları; "Ben devralıyorum" → e-posta/DM uygulamasına derin bağlantı.
- **Daha:** personalar (durdur/başlat), kanallar (sağlık), ayarlar, dil.
- Push kategorileri: kritik (para/hukuk/ban riski, sessiz saat yok), onay (toplu, saat penceresi), özet (günlük).
- Offline: son 200 kuyruk öğesi ve önizleme thumbnail'leri önbellekte; kararlar kuyruklanır.

## 6. Bileşen kütüphanesi (`packages/ui`)

Temel: `Button, IconButton, Input, Textarea, Select, Combobox, Switch, Slider, Checkbox, Radio, Tabs, Sheet, Dialog, Popover, Tooltip, Toast, Badge, Avatar, Skeleton, DataTable (cursor-aware), List (virtualized), EmptyState, Form (schema-driven), DateTimeField (timezone-aware), MoneyField, LanguageSwitch`.
İmza: `HorizonStrip, SignalLog, GateReport, ConstellationRail, TrendHeat, MoneyLine, MediaPreview (9:16 player, carousel, platform kartları)`.

Her bileşen: web + RN uygulaması, aynı props; story (varsayılan, tüm durumlar, sahte dil, RTL); erişilebilirlik testi; token dışı renk yasak.

## 7. Yazım tonu (UI copy)

- Kısa, fiil önce: "Onayla", "Yeniden üret", "Ben devralıyorum".
- Ünlem yok, "Harika!" yok. Hata: ne oldu + ne yapmalı ("Instagram token süresi doldu. Kanalı yeniden bağla.").
- Sistem kendini "biz" diye anmaz; edilgen yerine etken.
- Sayılar mono ve tabular; zaman "14 dk önce" göreli, üzerine gelince mutlak.

## 8. Erişilebilirlik

- WCAG 2.2 AA: kontrast ≥ 4.5:1 (flaş üzerindeki metin `flash-ink` ile 9:1), odak halkası 2px `tide`, hedef boyutu ≥ 24px web / 44pt mobil.
- Renk tek başına anlam taşımaz: sağlık noktalarının yanında metin/tooltip; GateReport'ta ikon + metin.
- Ekran okuyucu: canlı bölge yalnızca alarm ve onay sayacında (`aria-live="polite"`).
- Hareket azaltma ve büyük yazı desteği (RN `allowFontScaling`).

## 9. Marka varlıkları

- Logo: ayna + ışın soyutlaması; tek renk `ink`, koyu temada `ink` (açık). Simge: 16/32/512.
- Uygulama ikonu: `#0E1213` zemin, `flash` tek nokta ve ince ufuk çizgisi.
- Persona görsel kitleri bu sistemden bağımsızdır (her persona kendi markası); yalnızca yönetim arayüzü Heliograph kimliğini taşır.
