import { type KeyboardEvent, useId, useState } from 'react';
import type { TagInputProps } from '../props/select.js';

/**
 * Chip list + text entry: Enter or comma adds, Backspace on empty input removes the last chip.
 * Chips are a `ul` so screen readers announce the count; each chip has its own remove button.
 */
export function TagInput({
  label,
  hint,
  error,
  required = false,
  disabled = false,
  values,
  onChange,
  placeholder,
  max,
  removeLabel,
  testID,
}: TagInputProps) {
  const id = useId();
  const [draft, setDraft] = useState('');
  const invalid = error !== undefined;
  const hintId = `${id}-hint`;
  const full = max !== undefined && values.length >= max;

  const commit = () => {
    const next = draft.trim().replace(/,+$/, '').trim();
    if (!next || full || values.includes(next)) {
      setDraft('');
      return;
    }
    onChange([...values, next]);
    setDraft('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && draft === '' && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

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
      <div className="hg-tags" data-invalid={invalid || undefined} data-testid={testID}>
        {values.length ? (
          <ul className="hg-tags__list">
            {values.map((v) => (
              <li key={v} className="hg-tags__chip">
                <span>{v}</span>
                <button
                  type="button"
                  className="hg-tags__remove"
                  aria-label={removeLabel(v)}
                  disabled={disabled}
                  onClick={() => onChange(values.filter((x) => x !== v))}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <input
          id={id}
          className="hg-tags__input"
          value={draft}
          placeholder={placeholder}
          disabled={disabled || full}
          aria-invalid={invalid || undefined}
          aria-describedby={hint ? hintId : undefined}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commit}
        />
      </div>
      {hint ? (
        <p id={hintId} className="hg-field__hint">
          {hint}
        </p>
      ) : null}
      {invalid ? (
        <p className="hg-field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
