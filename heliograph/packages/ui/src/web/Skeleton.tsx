import type { SkeletonProps } from '../props/feedback.js';

const px = (v: number | string | undefined) => (typeof v === 'number' ? `${v}px` : v);

/** Loading placeholder; hidden from assistive tech — the container announces loading state. */
export function Skeleton({ width = '100%', height, shape = 'text', testID }: SkeletonProps) {
  const h = height ?? (shape === 'circle' ? width : undefined);
  return (
    <span
      className="hg-skeleton"
      data-shape={shape}
      data-testid={testID}
      aria-hidden="true"
      style={{ width: px(width), height: px(h) }}
    />
  );
}
