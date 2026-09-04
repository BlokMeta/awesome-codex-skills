/**
 * Props shared by the web (React DOM) and native (React Native) implementations of every
 * component (docs/07 §6: "aynı props, iki uygulama"). No platform types leak in here.
 * All user-visible text arrives already translated — components never contain raw strings.
 */
export type Tone = 'neutral' | 'tide' | 'flash' | 'good' | 'warn' | 'critical';
export type Size = 'sm' | 'md' | 'lg';

export interface TestableProps {
  /** Stable hook for e2e tests (web: data-testid, native: testID). */
  readonly testID?: string | undefined;
}

export interface AccessibleProps {
  /** Overrides the accessible name when the visible label is not enough (icon-only controls). */
  readonly accessibilityLabel?: string | undefined;
}
