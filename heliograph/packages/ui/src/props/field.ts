import type { TestableProps } from './common.js';

export interface FieldProps extends TestableProps {
  readonly label: string;
  readonly hint?: string | undefined;
  /** Already-translated error text; presence marks the field invalid. */
  readonly error?: string | undefined;
  readonly required?: boolean | undefined;
  readonly disabled?: boolean | undefined;
  readonly name?: string | undefined;
}

export type TextInputKind = 'text' | 'email' | 'password' | 'url' | 'number' | 'search';

export interface TextInputProps extends FieldProps {
  readonly value: string;
  readonly onChangeText: (value: string) => void;
  readonly placeholder?: string | undefined;
  readonly multiline?: boolean | undefined;
  readonly kind?: TextInputKind | undefined;
  readonly autoComplete?: string | undefined;
  readonly maxLength?: number | undefined;
}

export interface SwitchProps extends TestableProps {
  readonly label: string;
  readonly description?: string | undefined;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly disabled?: boolean | undefined;
  readonly name?: string | undefined;
}
