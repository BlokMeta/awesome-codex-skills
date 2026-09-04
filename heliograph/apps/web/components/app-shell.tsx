'use client';

import type { MeResponse } from '@heliograph/contracts';
import { messages } from '@heliograph/i18n';
import { Badge, Button } from '@heliograph/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { api } from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import { useT } from '@/lib/use-t';
import { LanguageSwitch } from './language-switch';

const NAV = [
  { href: '/', m: messages.nav.today },
  { href: '/personas', m: messages.persona.listTitle },
  { href: '/queue', m: messages.nav.queue },
  { href: '/calendar', m: messages.nav.calendar },
  { href: '/trends', m: messages.nav.trends },
  { href: '/inbox', m: messages.nav.inbox },
  { href: '/deals', m: messages.nav.deals },
  { href: '/library', m: messages.nav.library },
  { href: '/analytics', m: messages.nav.analytics },
] as const;

/**
 * Three-column shell (docs/07 §4): ConstellationRail on the start side, workspace in the middle,
 * inspector on the end side (M2). Below 1100px it collapses to a single column.
 */
export function AppShell({
  locale,
  children,
}: {
  locale: string;
  children: (me: MeResponse) => ReactNode;
}) {
  const t = useT();
  const router = useRouter();
  const queryClient = useQueryClient();
  const me = useQuery({ queryKey: ['me'], queryFn: () => api.identity.me() });

  if (me.isError) {
    router.replace('/sign-in');
    return null;
  }
  if (!me.data) return <div className="p-6 text-ink3">…</div>;
  const data = me.data;
  const active = data.workspaces.find((w) => w.id === data.activeWorkspaceId) ?? null;

  return (
    <div className="min-h-dvh grid grid-cols-1 lg:grid-cols-[240px_1fr]">
      <a href="#main" className="hg-skip-link">
        {t(messages.nav.skipToContent)}
      </a>
      <aside className="border-line lg:border-e p-4 grid content-start gap-6 bg-surface">
        <div className="grid gap-1">
          <span className="font-[family-name:var(--hg-font-display)] text-[length:var(--hg-font-size-lg)]">
            Heliograph
          </span>
          {active ? (
            <span
              className="flex items-center gap-2 text-ink2 text-[length:var(--hg-font-size-sm)]"
              data-testid="active-workspace"
            >
              {active.name}{' '}
              <Badge label={t(messages.workspace.role, { role: active.role })} tone="tide" />
            </span>
          ) : null}
        </div>
        <nav aria-label="Primary" className="grid gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 rounded-[var(--hg-radius-sm)] hover:bg-surface2 text-ink"
            >
              {t(item.m)}
            </Link>
          ))}
        </nav>
        {data.workspaces.length > 1 ? (
          <div className="grid gap-1">
            <span className="text-[length:var(--hg-font-size-xs)] text-ink3 uppercase tracking-[var(--hg-tracking-label)]">
              {t(messages.workspace.switch)}
            </span>
            {data.workspaces.map((w) => (
              <button
                key={w.id}
                type="button"
                className="text-start px-3 py-1 rounded-[var(--hg-radius-sm)] hover:bg-surface2"
                aria-current={w.id === data.activeWorkspaceId ? 'true' : undefined}
                onClick={async () => {
                  await authClient.organization.setActive({ organizationId: w.id });
                  await me.refetch();
                }}
              >
                {w.name}
              </button>
            ))}
          </div>
        ) : null}
        <div className="grid gap-3 mt-auto">
          <LanguageSwitch current={locale} />
          <Button
            label={t(messages.auth.signOut)}
            variant="ghost"
            size="sm"
            testID="sign-out"
            onPress={async () => {
              await authClient.signOut();
              queryClient.clear();
              router.push('/sign-in');
              router.refresh();
            }}
          />
        </div>
      </aside>
      <main id="main" className="p-6 lg:p-8">
        {children(data)}
      </main>
    </div>
  );
}
