import type { AccessibleProps, Size, TestableProps } from './common.js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends TestableProps, AccessibleProps {
  readonly label: string;
  readonly variant?: ButtonVariant | undefined;
  readonly size?: Size | undefined;
  readonly disabled?: boolean | undefined;
  /** Shows progress and blocks presses; the label stays visible for layout stability. */
  readonly loading?: boolean | undefined;
  /** One-shot "flash pulse" (docs/07 §2.4) — set true when something live just happened. */
  readonly flash?: boolean | undefined;
  readonly onPress?: (() => void) | undefined;
}

export interface IconButtonProps extends TestableProps {
  /** Required: icon-only controls have no visible text. */
  readonly accessibilityLabel: string;
  readonly variant?: ButtonVariant | undefined;
  readonly size?: Size | undefined;
  readonly disabled?: boolean | undefined;
  readonly onPress?: (() => void) | undefined;
}
