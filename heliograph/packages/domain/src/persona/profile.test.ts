import { describe, expect, it } from 'vitest';
import { archive, createDraft, readyToStart } from './persona.js';
import { DEFAULT_VOICE_BIBLE, VisualKitSchema, VoiceBibleSchema } from './profile.js';

const draft = () =>
  createDraft({
    id: '01J8Z3M9K2Q4R5S6T7V8W9X0Y1',
    workspaceId: '01J8Z3M9K2Q4R5S6T7V8W9X0Y2',
    slug: 'deniz',
    name: 'Deniz',
    niche: 'devops',
    language: 'tr',
    timezone: 'Europe/Istanbul',
  });

describe('persona profiles', () => {
  it('fills every profile with safe defaults (human review always, low emoji quota)', () => {
    const r = draft();
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.qualityPolicy.humanReview).toBe('always');
    expect(r.value.voiceBible.emojiQuota).toEqual({ min: 0, max: 2 });
    expect(r.value.engagementPolicy.autoReply).toBe(false);
    expect(r.value.postingPolicy.dailyPosts.max).toBe(5);
  });

  it('rejects an invalid slug with a field pointer', () => {
    const r = createDraft({
      id: '01J8Z3M9K2Q4R5S6T7V8W9X0Y1',
      workspaceId: '01J8Z3M9K2Q4R5S6T7V8W9X0Y2',
      slug: 'Deniz!',
      name: 'Deniz',
      niche: 'ai',
      language: 'en',
      timezone: 'UTC',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.params).toEqual({ issue: 'slug' });
  });

  it('requires a voice bible and topics before a persona can start', () => {
    const r = draft();
    if (!r.ok) throw new Error('draft failed');
    const missing = readyToStart(r.value);
    expect(missing?.params?.['fields']).toBe(
      'voiceBible.summary, voiceBible.tone, topicProfile.include',
    );
    const ready = {
      ...r.value,
      voiceBible: {
        ...DEFAULT_VOICE_BIBLE,
        summary:
          'Platform mühendisi; Kubernetes ve CI/CD üzerine somut, kısa deneyim notları paylaşır.',
        tone: ['dry', 'concrete'],
      },
      topicProfile: { ...r.value.topicProfile, include: ['kubernetes'] },
    };
    expect(readyToStart(ready)).toBeNull();
  });

  it('archives from any non-archived state and refuses twice', () => {
    const r = draft();
    if (!r.ok) throw new Error('draft failed');
    const archived = archive(r.value);
    expect(archived.ok && archived.value.status).toBe('archived');
    if (archived.ok) expect(archive(archived.value).ok).toBe(false);
  });

  it('validates hex colours and quotas', () => {
    expect(
      VisualKitSchema.safeParse({
        palette: { primary: 'red', accent: '#000000', ground: '#ffffff' },
      }).success,
    ).toBe(false);
    expect(VoiceBibleSchema.safeParse({ emojiQuota: { min: 0, max: 11 } }).success).toBe(false);
  });
});
