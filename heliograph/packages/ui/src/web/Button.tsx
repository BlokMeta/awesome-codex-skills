import type { ReactNode } from 'react';
import type { ButtonProps, IconButtonProps } from '../props/button.js';

export interface WebButtonProps extends ButtonProps {
  /** Leading icon (web only; native passes an icon component). */
  readonly icon?: ReactNode | undefined;
  readonly type?: 'button' | 'submit' | undefined;
}

export function Button({
  label,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  loading = false,
  flash = false,
  onPress,
  icon,
  type = 'button',
  testID,
  accessibilityLabel,
}: WebButtonProps) {
  const blocked = disabled || loading;
  return (
    <button
      type={type}
      className="hg-button"
      data-variant={variant}
      data-size={size}
      data-flash={flash || undefined}
      data-testid={testID}
      aria-label={accessibilityLabel}
      aria-busy={loading || undefined}
      aria-disabled={blocked || undefined}
      disabled={disabled}
      onClick={blocked ? undefined : onPress}
    >
      {loading ? <span className="hg-button__spinner" aria-hidden="true" /> : null}
      {icon ? (
        <span className="hg-button__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="hg-button__label">{label}</span>
    </button>
  );
}

export interface WebIconButtonProps extends IconButtonProps {
  readonly icon: ReactNode;
}

export function IconButton({
  icon,
  accessibilityLabel,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  onPress,
  testID,
}: WebIconButtonProps) {
  return (
    <button
      type="button"
      className="hg-button hg-button--icon"
      data-variant={variant}
      data-size={size}
      data-testid={testID}
      aria-label={accessibilityLabel}
      disabled={disabled}
      onClick={disabled ? undefined : onPress}
    >
      <span className="hg-button__icon" aria-hidden="true">
        {icon}
      </span>
    </button>
  );
}
