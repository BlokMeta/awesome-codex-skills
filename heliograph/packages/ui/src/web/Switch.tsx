import { Switch as BaseSwitch } from '@base-ui/react/switch';
import { useId } from 'react';
import type { SwitchProps } from '../props/field.js';

export function Switch({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  name,
  testID,
}: SwitchProps) {
  const labelId = useId();
  const descId = useId();
  return (
    <div className="hg-switch">
      <BaseSwitch.Root
        className="hg-switch__control"
        checked={checked}
        onCheckedChange={(next) => onChange(next)}
        disabled={disabled}
        name={name}
        aria-labelledby={labelId}
        aria-describedby={description ? descId : undefined}
        data-testid={testID}
      >
        <BaseSwitch.Thumb className="hg-switch__thumb" />
      </BaseSwitch.Root>
      <div className="hg-switch__text">
        <span id={labelId} className="hg-switch__label">
          {label}
        </span>
        {description ? (
          <span id={descId} className="hg-switch__description">
            {description}
          </span>
        ) : null}
      </div>
    </div>
  );
}
