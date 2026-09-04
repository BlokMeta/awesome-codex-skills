import type { TestableProps } from './common.js';

/**
 * Cursor-paginated, virtualized list (CLAUDE.md rule 4). The list never knows about cursors:
 * the container passes `hasMore` + `onLoadMore` from its TanStack Query page state.
 */
export interface ListProps<T> extends TestableProps {
  readonly items: readonly T[];
  readonly keyOf: (item: T) => string;
  /** Accessible name of the list region. */
  readonly ariaLabel: string;
  readonly hasMore: boolean;
  readonly loading?: boolean | undefined;
  readonly onLoadMore: () => void;
  readonly loadMoreLabel: string;
  readonly emptyTitle: string;
  readonly emptyDescription?: string | undefined;
  /** Row height estimate in px; rows are measured after mount. */
  readonly estimateSize?: number | undefined;
  /** Viewport height in px (the list scrolls inside itself). */
  readonly height?: number | undefined;
}
