import type { BadgeProps } from '../props/badge.js';

export function Badge({ label, tone = 'neutral', dot = false, testID }: BadgeProps) {
  return (
    <span className="hg-badge" data-tone={tone} data-testid={testID}>
      {dot ? <span className="hg-badge__dot" aria-hidden="true" /> : null}
      {label}
    </span>
  );
}
