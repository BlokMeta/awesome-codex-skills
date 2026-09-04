import type { TestableProps, Tone } from './common.js';

export interface BadgeProps extends TestableProps {
  readonly label: string;
  readonly tone?: Tone | undefined;
  /** Colour never carries meaning alone (docs/07 §8): a dot badge must still have a label. */
  readonly dot?: boolean | undefined;
}
