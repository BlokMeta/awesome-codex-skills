import { Field } from '@base-ui/react/field';
import { useId } from 'react';
import type { TextInputProps } from '../props/field.js';

/**
 * Labelled text input / textarea with hint and error wiring (label ↔ control, aria-describedby,
 * aria-invalid) handled by Base UI Field. Validation itself lives in the form schema (docs/03 §8).
 */
export function TextInput({
  label,
  hint,
  error,
  required = false,
  disabled = false,
  name,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  kind = 'text',
  autoComplete,
  maxLength,
  testID,
}: TextInputProps) {
  const id = useId();
  const invalid = error !== undefined;
  return (
    <Field.Root className="hg-field" invalid={invalid} disabled={disabled} name={name}>
      <Field.Label className="hg-field__label" htmlFor={id}>
        {label}
        {required ? (
          <span className="hg-field__required" aria-hidden="true">
            *
          </span>
        ) : null}
      </Field.Label>
      <Field.Control
        id={id}
        className="hg-field__control"
        data-testid={testID}
        render={multiline ? <textarea rows={4} /> : <input type={kind} />}
        value={value}
        onValueChange={(v) => onChangeText(String(v))}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        maxLength={maxLength}
      />
      {hint ? <Field.Description className="hg-field__hint">{hint}</Field.Description> : null}
      {invalid ? (
        <Field.Error className="hg-field__error" match>
          {error}
        </Field.Error>
      ) : null}
    </Field.Root>
  );
}
