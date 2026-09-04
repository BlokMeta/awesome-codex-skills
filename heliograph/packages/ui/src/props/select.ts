import type { FieldProps } from './field.js';

export interface SelectOption<V extends string = string> {
  readonly value: V;
  readonly label: string;
}

export interface SelectFieldProps<V extends string = string> extends FieldProps {
  readonly value: V;
  readonly onChange: (value: V) => void;
  readonly options: readonly SelectOption<V>[];
}

export interface TagInputProps extends FieldProps {
  readonly values: readonly string[];
  readonly onChange: (values: string[]) => void;
  readonly placeholder?: string;
  readonly max?: number;
  /** Accessible name for the per-chip remove buttons: receives the chip text. */
  readonly removeLabel: (value: string) => string;
}
