# 13 — Referans Projeler, Skill'ler ve Ajan Hafızası Düzeni

## 1. Bu repodaki skill'ler (doğrudan kullanılabilir)

| Skill (klasör) | Nerede kullanılır |
|---|---|
| `webapp-testing/` | Playwright ile yerel web uygulamasını sürme, ekran görüntüsü, konsol logu; e2e yazarken |
| `canvas-design/` | Marka görselleri, persona görsel kiti taslakları; `canvas-fonts/` içinde Bricolage Grotesque, IBM Plex, JetBrains Mono var |
| `theme-factory/` | Persona görsel kitleri için hızlı tema üretimi (Heliograph kimliği için **değil**; o `07-tasarim-sistemi.md`) |
| `changelog-generator/` | Sürüm notları |
| `pr-review-ci-fix/`, `gh-fix-ci/`, `gh-address-comments/` | PR döngüsü |
| `skill-creator/`, `template-skill/` | Proje-yerel skill yazmak için (`heliograph/.claude/skills/`) |
| `mcp-builder/` | İleride Heliograph'ı MCP sunucusu olarak açmak istersek |
| `composio-skills/elevenlabs-automation/` | TTS entegrasyonu referansı (Rube MCP) |
| `composio-skills/ayrshare-automation/`, `typefully-automation/`, `heygen-automation/` | Yedek sürücü ve avatar referansları |
| `create-plan/` | Faz planı çıkarırken |

Not: Bu repoda `instagram/tiktok/youtube/twitter/telegram/threads-automation` klasörleri **yok** (üst repodaki README bağlantıları güncel değil). Platform adaptörleri kendimiz yazılır.

## 2. Dış skill'ler (kurulması önerilen)

| Skill | Yıldız | Ne için |
|---|---|---|
| `anthropics/skills` → `frontend-design` | 173K (repo) | "AI-slop" olmayan UI kararları; her yeni ekranda okunur |
| `anthropics/skills` → `web-artifacts-builder`, `webapp-testing` | – | Prototip ve test |
| `vercel-labs/agent-skills` → `react-best-practices`, `web-design-guidelines`, `react-native-guidelines`, `composition-patterns` | 31K | 40+ performans kuralı, 100+ a11y/UX kuralı; PR incelemesinde |
| `expo/skills` → `expo-project-structure`, `expo-router`, `expo-design-system`, `expo-data-fetching`, `eas-*`, `expo-upgrade` | 2.5K | Resmi Expo rehberleri; mobil işlerde |
| `bitjaru/styleseed` | 939 | Tasarım kararlarını sabitleyen 23 skill; palet/tipografi tutarlılığı |
| `educlopez/ui-craft` | 310 | Nielsen sezgiselleri ile puanlanabilir UI kritiği |
| `addyosmani/web-quality-skills` | 2.7K | Core Web Vitals ve erişilebilirlik kontrolleri |
| `obra/superpowers` | 281K | `test-driven-development`, `verification-before-completion`, `requesting-code-review` |
| `anthropics/claude-code-security-review` | 6.2K | PR diff güvenlik incelemesi (GitHub Action) |
| `trailofbits/skills` | 7K | CodeQL/Semgrep tabanlı statik analiz |
| `zivtech/accessibility-skills` | 6 | WCAG 2.2 planlayıcı/test edici |
| `i18next/i18next-cli` skill | 235 | Yalnızca i18next seçilseydi; Lingui için skill yok, `06-i18n.md` yeterli |
| `EvolveHQ/docflow` | 11 | ADR iskeleti + AGENTS.md düzeni |
| `Agents365-ai/drawio-skill` | 9K | C4 diyagramlarını `.drawio` olarak üretmek |

Kurulum: `python skill-installer/scripts/install-skill-from-github.py --repo <owner/repo> --path <skill>`.

## 3. Referans projeler (mimari ve UI için okunacak)

### Yönetim arayüzü / tasarım
| Repo | Yıldız | Neden bakılır |
|---|---|---|
| `twentyhq/twenty` | 56K | Nx monorepo, `twenty-ui` tasarım sistemi, Lingui, Storybook, `twenty-claude-skills` (ajan-hazır repo örneği); kayıt/tablo/kanban |
| `makeplane/plane` | 59K | Aynı verinin liste/kanban/takvim/gantt görünümleri; `packages/ui`, `packages/i18n` |
| `calcom/cal.com` | 48K | Turborepo, `packages/features` düzeni, Playwright |
| `dubinc/dub` | 25K | Yüksek işçilikli analitik panosu |
| `midday-ai/midday` | 15K | Kısıtlı, ayırt edici görsel dil (shadcn tabanlı ama farklı) |
| `documenso/documenso` | 15K | shadcn'in tutarlı kullanımı, Lingui, Biome |
| `hcengineering/platform` (Huly) | 28K | Klavye-öncelikli, yoğun UI |
| `gitroomhq/postiz-app` | 35K | **Alan eşleşmesi**: sağlayıcı soyutlaması, takvim, Temporal; görsel işçilik için değil |
| `formbricks/formbricks` | 13K | i18next+ICU, Vitest+Playwright, Storybook |
| `openstatusHQ/openstatus` | 9K | Veri yoğun ama minimal |

### React Native
| Repo | Yıldız | Neden bakılır |
|---|---|---|
| `bluesky-social/social-app` | 18K | Expo 57 + RN-Web tek kod tabanı, ALF tasarım sistemi (`src/alf/`), TanStack Query persist, Lingui + Crowdin, **Maestro** |
| `Expensify/App` | 5K | `contributingGuides/` (STYLE, ACCESSIBILITY, OFFLINE_UX, PERFORMANCE, PR_REVIEW_GUIDELINES, AI_ETIQUETTE) — yazılı mühendislik kuralları örneği; Reassure performans testleri |
| `obytes/react-native-template-obytes` | 4.3K | Expo + expo-router + TanStack Query + EAS + GH Actions modern başlangıç |
| `mattermost/mattermost-mobile` | 2.7K | WatermelonDB offline-first |
| `infinitered/ignite` | 20K | Üreteçler, i18n, test düzeni |

## 4. Ajan hafızası düzeni (bu projede uygulanan)

Claude Code resmi mekanikleri: `./CLAUDE.md` otomatik yüklenir (< 200 satır hedefi), alt dizin `CLAUDE.md`'leri o dizindeki dosyalar okununca yüklenir, `.claude/rules/*.md` konu başına ve `paths:` ile kapsamlı, `@dosya` import (derinlik 4), `AGENTS.md` ortak format (Codex/Cursor).

```
awesome-codex-skills/
  CLAUDE.md                     → "@heliograph/CLAUDE.md" (kök işaretçi)
  heliograph/
    CLAUDE.md                   ≤ 200 satır: kurallar, komutlar, harita
    AGENTS.md                   Codex için aynı içerik (CLAUDE.md'ye işaret)
    .claude/rules/              (M0'da) frontend.md, api.md, testing.md, i18n.md — paths: ile kapsamlı
    .claude/skills/             proje-yerel prosedürler (ör. add-platform-adapter, add-locale)
    docs/                       01–13 + adr/ + runbooks/
    specs/NNN-feature/          (isteğe bağlı) spec.md, plan.md, tasks.md — Spec Kit / Kiro tarzı
```

Kurallar: her karar ADR; her modül README; yol haritası canlı; sohbet geçmişine güvenilmez, `docs/` güncellenir.

## 5. Spec-driven akış (büyük özellikler için)

1. `specs/NNN-<özellik>/spec.md`: problem, kullanıcı hikâyeleri, EARS kabul kriterleri ("WHEN … THE SYSTEM SHALL …").
2. `plan.md`: etkilenen modüller, contract değişiklikleri, veri modeli, test planı.
3. `tasks.md`: DoD'lu görev listesi.
4. Uygulama; PR spec'e bağlanır; spec kapanınca `12-teknik-yol-haritasi.md` işaretlenir.
