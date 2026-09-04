'use client';

import type { ConsentStatus } from '@heliograph/contracts';
import type { LegalDocument } from '@heliograph/domain';
import { messages } from '@heliograph/i18n';
import { Button } from '@heliograph/ui';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useT } from '@/lib/use-t';

export const LEGAL_LINKS: Record<string, string> = {
  terms: '/legal/terms',
  privacy: '/legal/privacy',
  aup: '/legal/aup',
  ai_processing: '/legal/ai-disclosure',
  kvkk_aydinlatma: '/legal/kvkk',
  distance_sale: '/legal/distance-sale',
  cookies: '/legal/cookies',
};

/** Onboarding gate: lists the documents still pending at their published version (rule 15). */
export function ConsentsForm({ onDone }: { onDone?: () => void }) {
  const t = useT();
  const router = useRouter();
  const status = useQuery({ queryKey: ['consents'], queryFn: () => api.privacy.consentStatus() });
  const accept = useMutation({
    mutationFn: (s: ConsentStatus) =>
      api.privacy.acceptConsents({
        accept: s.pending.map((document) => ({ document, version: s.published[document] ?? '' })),
      }),
    onSuccess: () => {
      if (onDone) onDone();
      else {
        router.push('/');
        router.refresh();
      }
    },
  });
  const s = status.data;
  if (!s) return null;
  if (s.pending.length === 0) {
    onDone?.();
    return null;
  }
  const docLabel = (d: LegalDocument) => t(messages.consent.doc[d]);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        accept.mutate(s);
      }}
      className="grid gap-4"
    >
      <p className="m-0 text-ink2">{t(messages.consent.intro)}</p>
      <ul className="m-0 p-0 list-none grid gap-2" data-testid="pending-docs">
        {s.pending.map((doc) => (
          <li
            key={doc}
            className="flex items-center justify-between gap-3 border-b border-line py-2"
          >
            <span>
              {docLabel(doc)}{' '}
              <span className="text-ink3 font-mono text-[length:var(--hg-font-size-xs)]">
                v{s.published[doc]}
              </span>
            </span>
            {LEGAL_LINKS[doc] ? (
              <a
                href={LEGAL_LINKS[doc]}
                target="_blank"
                rel="noreferrer"
                className="text-tide underline text-[length:var(--hg-font-size-sm)]"
              >
                {t(messages.consent.read)}
              </a>
            ) : null}
          </li>
        ))}
      </ul>
      <Button
        type="submit"
        label={t(messages.consent.acceptAll)}
        variant="primary"
        size="lg"
        loading={accept.isPending}
        testID="accept"
      />
    </form>
  );
}
