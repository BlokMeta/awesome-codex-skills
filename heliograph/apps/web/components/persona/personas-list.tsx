'use client';

import { messages } from '@heliograph/i18n';
import { Button, EmptyState, List, Skeleton } from '@heliograph/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePersonaList } from '@/lib/personas';
import { useT } from '@/lib/use-t';
import { StatusBadge } from './status-badge';

export function PersonasList() {
  const t = useT();
  const router = useRouter();
  const q = usePersonaList();
  const items = q.data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <div className="grid gap-6 max-w-3xl">
      <header className="flex items-end justify-between gap-4">
        <h1 className="m-0 text-[length:var(--hg-font-size-2xl)] leading-[var(--hg-line-height-2xl)]">
          {t(messages.persona.listTitle)}
        </h1>
        <Button
          label={t(messages.persona.newPersona)}
          variant="primary"
          onPress={() => router.push('/personas/new')}
          testID="new-persona"
        />
      </header>
      {q.isPending ? (
        <div className="grid gap-2">
          <Skeleton />
          <Skeleton width="70%" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title={t(messages.persona.empty)}
          description={t(messages.persona.emptyHint)}
          actionLabel={t(messages.persona.newPersona)}
          onAction={() => router.push('/personas/new')}
          testID="personas-empty"
        />
      ) : (
        <List
          items={items}
          keyOf={(p) => p.id}
          ariaLabel={t(messages.persona.listTitle)}
          hasMore={q.hasNextPage}
          loading={q.isFetchingNextPage}
          onLoadMore={() => void q.fetchNextPage()}
          loadMoreLabel={t(messages.persona.loadMore)}
          emptyTitle={t(messages.persona.empty)}
          estimateSize={64}
          height={520}
          testID="personas-list"
          renderItem={(p) => (
            <Link
              href={`/personas/${p.id}/wizard`}
              className="flex items-center justify-between gap-4 px-3 py-3 hover:bg-surface2 text-ink no-underline"
            >
              <span className="grid gap-0.5">
                <span className="font-medium">{p.name}</span>
                <span className="text-ink3 font-mono text-[length:var(--hg-font-size-xs)]">
                  /{p.slug} · {t(messages.persona.niche[p.niche])}
                </span>
              </span>
              <StatusBadge status={p.status} />
            </Link>
          )}
        />
      )}
    </div>
  );
}
