import type { TestableProps } from './common.js';

export interface SkeletonProps extends TestableProps {
  /** Width in px or a CSS/percentage string; height defaults to one text line. */
  readonly width?: number | string | undefined;
  readonly height?: number | string | undefined;
  readonly shape?: 'text' | 'rect' | 'circle' | undefined;
}

export interface EmptyStateProps extends TestableProps {
  readonly title: string;
  readonly description?: string | undefined;
  readonly actionLabel?: string | undefined;
  readonly onAction?: (() => void) | undefined;
}
