'use client';

import type { MeResponse } from '@heliograph/contracts';
import { messages } from '@heliograph/i18n';
import { EmptyState, Skeleton } from '@heliograph/ui';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { api } from '@/lib/api';
import { useT } from '@/lib/use-t';

/** Home: plan + credits (live from the API), then the empty state until the first persona. */
export function Today({ me }: { me: MeResponse }) {
  const t = useT();
  const router = useRouter();
  const consents = useQuery({ queryKey: ['consents'], queryFn: () => api.privacy.consentStatus() });
  const entitlements = useQuery({
    queryKey: ['entitlements', me.activeWorkspaceId],
    queryFn: () => api.billing.entitlements(),
    enabled: me.activeWorkspaceId !== null,
  });

  useEffect(() => {
    if (consents.data && consents.data.pending.length > 0) router.replace('/consents');
    else if (consents.data && me.workspaces.length === 0) router.replace('/workspaces/new');
  }, [consents.data, me.workspaces.length, router]);

  return (
    <div className="grid gap-6 max-w-3xl">
      <header className="grid gap-1">
        <h1 className="m-0 text-[length:var(--hg-font-size-2xl)] leading-[var(--hg-line-height-2xl)]">
          {t(messages.today.title)}
        </h1>
        <p className="m-0 text-ink2" data-testid="welcome">
          {t(messages.today.welcome, { name: me.operator.name })}
        </p>
      </header>
      <section
        className="flex flex-wrap gap-4 text-[length:var(--hg-font-size-sm)] text-ink2"
        aria-live="polite"
      >
        {entitlements.data ? (
          <>
            <span data-testid="plan">
              {t(messages.today.plan, { plan: entitlements.data.plan.name })}
            </span>
            <span data-testid="credits">
              {t(messages.today.credits, { balance: entitlements.data.credits.balance })}
            </span>
          </>
        ) : me.activeWorkspaceId ? (
          <Skeleton width={220} />
        ) : null}
      </section>
      <EmptyState
        title={t(messages.today.empty)}
        actionLabel={t(messages.persona.newPersona)}
        onAction={() => router.push('/personas/new')}
        testID="today-empty"
      />
    </div>
  );
}
