import { useId } from 'react';
import type { SelectFieldProps } from '../props/select.js';

/** Native select styled like TextInput; native because keyboard + mobile behaviour is free. */
export function SelectField<V extends string>({
  label,
  hint,
  error,
  required = false,
  disabled = false,
  name,
  value,
  onChange,
  options,
  testID,
}: SelectFieldProps<V>) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const invalid = error !== undefined;
  const describedBy = [hint ? hintId : null, invalid ? errorId : null].filter(Boolean).join(' ');
  return (
    <div className="hg-field">
      <label className="hg-field__label" htmlFor={id}>
        {label}
        {required ? (
          <span className="hg-field__required" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      <select
        id={id}
        name={name}
        className="hg-field__control"
        value={value}
        disabled={disabled}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy || undefined}
        data-testid={testID}
        onChange={(e) => onChange(e.target.value as V)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint ? (
        <p id={hintId} className="hg-field__hint">
          {hint}
        </p>
      ) : null}
      {invalid ? (
        <p id={errorId} className="hg-field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
