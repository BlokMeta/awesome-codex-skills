import { useVirtualizer } from '@tanstack/react-virtual';
import { type ReactNode, useEffect, useRef } from 'react';
import type { ListProps } from '../props/list.js';
import { Button } from './Button.js';
import { EmptyState } from './EmptyState.js';

export interface WebListProps<T> extends ListProps<T> {
  readonly renderItem: (item: T, index: number) => ReactNode;
}

/**
 * Virtualized list with a "load more" tail. Loads the next page when the tail scrolls into view
 * (IntersectionObserver) and always offers a button for keyboard and screen-reader users.
 */
export function List<T>({
  items,
  keyOf,
  renderItem,
  ariaLabel,
  hasMore,
  loading = false,
  onLoadMore,
  loadMoreLabel,
  emptyTitle,
  emptyDescription,
  estimateSize = 56,
  height = 480,
  testID,
}: WebListProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const tailRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimateSize,
    overscan: 4,
    initialRect: { width: 0, height },
    // Environments without layout (SSR, jsdom) report 0 px; fall back to the configured sizes.
    observeElementRect: (instance, cb) => {
      const el = instance.scrollElement;
      const report = () => cb({ width: el?.clientWidth ?? 0, height: el?.clientHeight || height });
      report();
      if (!el || typeof ResizeObserver === 'undefined') return undefined;
      const ro = new ResizeObserver(report);
      ro.observe(el);
      return () => ro.disconnect();
    },
    measureElement: (el) => {
      const measured = el.getBoundingClientRect().height;
      return measured > 0 ? measured : estimateSize;
    },
  });

  useEffect(() => {
    const tail = tailRef.current;
    if (!tail || !hasMore || loading || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) onLoadMore();
    });
    observer.observe(tail);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  if (items.length === 0 && !loading) {
    return <EmptyState title={emptyTitle} description={emptyDescription} testID={testID} />;
  }

  return (
    <div className="hg-list" data-testid={testID} style={{ height }} ref={scrollRef}>
      <ul
        className="hg-list__inner"
        aria-label={ariaLabel}
        aria-busy={loading || undefined}
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map((row) => {
          const item = items[row.index] as T;
          return (
            <li
              key={keyOf(item)}
              className="hg-list__row"
              data-index={row.index}
              ref={virtualizer.measureElement}
              style={{ transform: `translateY(${row.start}px)` }}
            >
              {renderItem(item, row.index)}
            </li>
          );
        })}
      </ul>
      {hasMore ? (
        <div className="hg-list__tail" ref={tailRef}>
          <Button label={loadMoreLabel} variant="ghost" loading={loading} onPress={onLoadMore} />
        </div>
      ) : null}
    </div>
  );
}
