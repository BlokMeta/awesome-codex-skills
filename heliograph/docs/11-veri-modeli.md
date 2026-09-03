# 11 — Veri Modeli

Tüm tablolar: `id ULID PK`, `workspace_id`, `created_at`, `updated_at`, gerektiğinde `deleted_at` (soft delete yalnızca kullanıcı görünür varlıklarda). RLS: `workspace_id = current_setting('hg.workspace_id')`. Şema sahipliği modül başınadır; başka modül tabloya dokunmaz.

## 1. identity

```sql
workspaces (id, name, plan, locale, timezone)
operators (id, workspace_id, email UNIQUE, password_hash, totp_secret ENC, locale, timezone, role)
passkeys (id, operator_id, credential_id, public_key, counter, transports[])
sessions (id, operator_id, refresh_family, refresh_hash, expires_at, revoked_at, device JSONB)
api_keys (id, workspace_id, name, hash, scopes[], last_used_at)
idempotency_keys (key PK, workspace_id, request_hash, response JSONB, status_code, expires_at)
```

## 2. persona

```sql
personas (id, workspace_id, slug UNIQUE(workspace_id, slug), name, niche, language, timezone,
  voice_bible JSONB, visual_kit JSONB, topic_profile JSONB,
  posting_policy JSONB, engagement_policy JSONB, quality_policy JSONB,
  status ENUM('draft','warming','active','paused','archived'), warmup_started_at)
persona_versions (id, persona_id, snapshot JSONB, changed_by, reason)   -- ses kitabı geçmişi
```

`posting_policy` şeması (Zod): `{ dailyPosts: {min,max}, dailyVideos: {min,max}, windows: [{days:[1..7], from:'09:00', to:'21:00'}], jitterMinutes, weekendFactor, formats: {news:1, educational:1, opinion:1, tip:1, community:1} }`.

## 3. channel

```sql
channels (id, workspace_id, persona_id, platform ENUM, external_account_id, handle, display_name,
  credential_id, scopes[], capabilities JSONB, quota_state JSONB,
  health ENUM('ok','token_expiring','token_expired','rate_limited','restricted','banned'),
  last_sync_at, last_error JSONB, UNIQUE(platform, external_account_id))
credentials (id, workspace_id, kind, ciphertext BYTEA, wrapped_dek BYTEA, key_version, expires_at, rotated_at)
quota_ledger (id, channel_id, kind, amount, window_start, window_end, source)   -- kota harcama kaydı
```

## 4. trend

```sql
sources (id, workspace_id, kind ENUM('rss','hn','hf','github','arxiv','search','bluesky','mastodon','youtube'), config JSONB, weight, enabled, last_run_at)
signals (id, source_id, external_id, url, canonical_url, title, summary, lang, published_at, discovered_at,
  embedding VECTOR(1024), raw JSONB, UNIQUE(source_id, external_id))
clusters (id, workspace_id, representative_signal_id, title, summary, first_seen_at, last_seen_at,
  source_count, velocity, authority, niche_scores JSONB, score, status ENUM('new','briefed','ignored','stale'))
cluster_signals (cluster_id, signal_id, similarity, PRIMARY KEY(cluster_id, signal_id))
```

İndeksler: `signals USING hnsw (embedding vector_cosine_ops)`, `clusters (workspace_id, score DESC, last_seen_at)`.

## 5. content

```sql
briefs (id, workspace_id, persona_id, cluster_id NULL, origin ENUM('trend','manual','library','comment_mined'),
  topic, angle, format ENUM, target_channel_ids[], scheduled_for, status ENUM('new','generating','ready','rejected','cancelled'))
drafts (id, brief_id, version, script JSONB, per_channel_text JSONB, prompt_hash, model, usage JSONB, chosen)
```

## 6. media

```sql
assets (id, workspace_id, draft_id NULL, kind ENUM('video','image','carousel','audio','thumbnail'), storage_key, mime, bytes,
  duration_ms, width, height, metadata JSONB, provenance JSONB, synthetic_media BOOL, c2pa_embedded BOOL, version)
render_jobs (id, asset_id, kind, template_id, input JSONB, status, started_at, finished_at, error JSONB, cost_usd)
media_library (id, workspace_id, persona_id, storage_key, mime, tags[], embedding VECTOR(1024), quality_score,
  used_count, last_used_at, do_not_use_before, consent JSONB)
library_plans (id, persona_id, rule JSONB, enabled)   -- {everyNDays:2, at:'19:30', jitter:20, channels:[...]} 
```

`provenance` şeması: `{ sources:[{kind:'stock'|'ai'|'own'|'screen', ref, license, attribution?}], models:[{name, promptHash, at}] }`.

## 7. quality

```sql
gate_runs (id, workspace_id, draft_id, asset_id NULL, policy_snapshot JSONB, total_score, passed BOOL,
  layers JSONB,   -- [{layer:'K1', passed, score, reasons:[...]}]
  attempt, finished_at)
review_tasks (id, workspace_id, persona_id, gate_run_id, kind ENUM('content','reply','deal_reply'),
  status ENUM('open','approved','rejected','edited','expired'), decided_by, decided_at, decision JSONB, expires_at)
approved_contents (id, draft_id, asset_ids[], gate_run_id, review_task_id NULL, approved_at)   -- publishing yalnızca bunu okur
```

## 8. publishing

```sql
scheduled_posts (id, workspace_id, approved_content_id, channel_id, scheduled_for, window JSONB,
  status ENUM('scheduled','publishing','published','failed','skipped','cancelled'), attempts, workflow_id)
posts (id, scheduled_post_id, channel_id, external_post_id, permalink, published_at, caption, hashtags[],
  labels JSONB)   -- {ad:true, aiDisclosed:true, automatedLabel:true}
publish_attempts (id, scheduled_post_id, at, result, error_class, error JSONB, idempotency_key)
```

## 9. engagement

```sql
interactions (id, workspace_id, channel_id, kind ENUM('comment','dm','email','mention'), external_id, thread_id,
  author_handle, author_display, text, lang, received_at, classification JSONB,
  status ENUM('new','auto_replied','needs_human','escalated','ignored'), replied_at, reply_text, review_task_id NULL,
  anonymized_at, UNIQUE(channel_id, kind, external_id))
escalations (id, interaction_id, kind ENUM('money','legal','business','personal_data','other'), severity, alert_id, resolved_at)
```

## 10. deals

```sql
deals (id, workspace_id, persona_id, interaction_id NULL, brand, contact JSONB, stage ENUM('lead','qualified','negotiating','won','lost'),
  estimated_value NUMERIC(12,2), currency, notes, next_action_at, closed_at)
media_kits (id, persona_id, generated_at, storage_key, stats JSONB)
rate_cards (id, persona_id, items JSONB)
```

## 11. analytics

```sql
post_metrics (post_id, captured_at, views, likes, comments, shares, saves, watch_time_s, ctr, PRIMARY KEY(post_id, captured_at))
post_features (post_id PK, hook_type, format, topic_cluster_id, hour_bucket, template_id, cta_type)
experiments (id, persona_id, channel_id, arm_key, alpha, beta, updated_at)   -- Thompson sampling
weekly_reports (id, workspace_id, week_start, body JSONB, storage_key)
```

## 12. notification / cost / audit

```sql
alerts (id, workspace_id, persona_id NULL, severity ENUM('info','warning','critical'), kind, payload JSONB, runbook,
  delivered JSONB, acknowledged_by, acknowledged_at)
push_tokens (id, operator_id, platform, token, last_seen_at)
usage_records (id, workspace_id, module, provider, model, unit, quantity, cost_usd, ref_type, ref_id, at)
budgets (id, workspace_id, scope ENUM('workspace','persona'), scope_id, daily_usd, monthly_usd, cutoff BOOL)
audit_log (id, workspace_id, actor_type, actor_id, action, resource_type, resource_id, before JSONB, after JSONB, request_id, workflow_id, at)  -- append-only
outbox (id, aggregate_type, aggregate_id, event_type, payload JSONB, created_at, published_at NULL)
```

## 12a. identity (çok kiracılı ek)

```sql
memberships (id, operator_id, workspace_id, role ENUM('owner','admin','editor','viewer'), invited_by, accepted_at, UNIQUE(operator_id, workspace_id))
invitations (id, workspace_id, email, role, token_hash, expires_at, accepted_at)
operators.is_superadmin BOOL DEFAULT false
operators.deleted_at TIMESTAMPTZ NULL      -- hesap silme (30 gün sonra hard delete)
```

## 12b. config (ADR-0011)

```sql
policy_entries (id, key, scope ENUM('global','platform','workspace'), scope_id NULL, value JSONB, version INT,
  effective_from, verified_at, verified_by, source_url, max_age_days, notes,
  UNIQUE(key, scope, scope_id, version))
feature_flags (id, key, description, default_on BOOL, rules JSONB, updated_at)
```

Tohum anahtarları (`tooling/seed/config.ts`): platform limitleri, kabiliyet matrisi, fiyatlar, model adları, saklama süreleri, yasal metin sürümleri, trend kaynakları.

## 12c. billing

```sql
plans (id, code UNIQUE, name, interval ENUM('month','year'), price_minor INT, currency, active BOOL, sort, public BOOL)
plan_entitlements (plan_id, feature, limit_value NUMERIC, PRIMARY KEY(plan_id, feature))
  -- feature: connected_accounts, personas, daily_posts, daily_videos, ai_credits_month, team_members, manual_library, priority_support...
subscriptions (id, workspace_id, plan_id, provider ENUM('paddle','iyzico','apple','google','manual'), provider_ref,
  status ENUM('trialing','active','past_due','paused','cancelled','expired'), current_period_start, current_period_end,
  cancel_at_period_end BOOL, trial_ends_at, seats INT, extra_accounts INT)
credit_ledger (id, workspace_id, delta INT, reason ENUM('plan_grant','purchase','usage','refund','bonus','expiry'), ref_type, ref_id, balance_after INT, at)
invoices (id, workspace_id, provider, provider_ref, number, amount_minor, currency, tax_minor, status, issued_at, pdf_key, efatura_ref NULL)
payment_events (id, provider, event_id UNIQUE, payload JSONB, processed_at)
coupons (id, code UNIQUE, kind, value, max_redemptions, expires_at)
```

## 12d. privacy

```sql
consent_records (id, operator_id, workspace_id NULL, document ENUM('terms','privacy','kvkk_aydinlatma','kvkk_acik_riza','cookies','marketing_iys','distance_sale'), version, accepted_at, ip, user_agent)
erasure_requests (id, workspace_id NULL, operator_id NULL, channel_id NULL, source ENUM('user','meta_callback','support'), requested_at, due_at, completed_at, confirmation_code)
data_exports (id, operator_id, requested_at, ready_at, storage_key, expires_at)
```

## 13. Sayfalama anahtarları (indeks garantisi)

| Liste | Sıralama anahtarı | İndeks |
|---|---|---|
| review_tasks | `(created_at DESC, id)` | `(workspace_id, status, created_at DESC, id)` |
| interactions | `(received_at DESC, id)` | `(workspace_id, status, received_at DESC, id)` |
| posts | `(published_at DESC, id)` | `(workspace_id, channel_id, published_at DESC, id)` |
| clusters | `(score DESC, id)` | yukarıda |
| scheduled_posts | `(scheduled_for ASC, id)` | `(workspace_id, scheduled_for, id)` |

## 14. Saklama

| Veri | Süre |
|---|---|
| signals | 90 gün (kümeler kalır) |
| interactions metni | 90 gün sonra anonim |
| render_jobs, publish_attempts | 180 gün |
| usage_records | 24 ay |
| audit_log | 5 yıl |
