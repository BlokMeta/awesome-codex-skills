---
version: 2026-09-03
status: draft — provider DPAs/SCCs to be collected
---

# Sub-processors

Generated from the `legal.subprocessors` config key; changes are announced by email 30 days in advance.

| Provider | Purpose | Country | Transfer mechanism | Data |
|---|---|---|---|---|
| Anthropic | Text generation, classification, quality judge | USA | SCC; no-training clause | Content texts, comment/message texts (pseudonymised) |
| Google Cloud / Gemini (optional) | Image/voice fallback | USA/EU | SCC | Prompts |
| ElevenLabs | Text-to-speech, voice clone (with consent) | USA | SCC | Script text, voice recordings |
| fal.ai | Image/video generation, LoRA training (with consent) | USA | SCC | Prompts, photos |
| Cloudflare | Media storage (R2), DNS | Global | SCC | Media files |
| Hetzner | Hosting | Germany (EU) | Intra-EU | All application data |
| Paddle | Payments, invoicing, tax (merchant of record) | UK | SCC / UK IDTA | Name, email, billing address, payment status |
| iyzico (phase 2) | Payments in Türkiye | Türkiye | – | Payment data |
| Resend | Transactional and inbound email | USA | SCC | Email address and content |
| Sentry | Error tracking (EU region) | USA/EU | SCC | Technical logs (redacted) |
| Expo (EAS) | Mobile builds, push notifications | USA | SCC | Push token |

Social media platforms (Meta, Google/YouTube, TikTok, X, Telegram) are independent controllers you authorise, not sub-processors.
