import { Dialog } from '@base-ui/react/dialog';
import type { ReactNode } from 'react';
import type { SheetProps } from '../props/sheet.js';

const CloseIcon = (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
    <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export interface WebSheetProps extends SheetProps {
  readonly children?: ReactNode | undefined;
}

/**
 * Modal side panel (web) / bottom sheet (mobile twin). Focus is trapped, Escape and backdrop
 * close it, and the title is the dialog's accessible name. Motion respects reduced-motion (CSS).
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  closeLabel,
  side = 'end',
  children,
  testID,
}: WebSheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => onOpenChange(next)} modal>
      <Dialog.Portal>
        <Dialog.Backdrop className="hg-sheet__backdrop" />
        <Dialog.Popup className="hg-sheet" data-side={side} data-testid={testID}>
          <header className="hg-sheet__header">
            <div>
              <Dialog.Title className="hg-sheet__title">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="hg-sheet__description">
                  {description}
                </Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close
              className="hg-button hg-button--icon"
              data-variant="ghost"
              data-size="sm"
              aria-label={closeLabel}
            >
              <span className="hg-button__icon" aria-hidden="true">
                {CloseIcon}
              </span>
            </Dialog.Close>
          </header>
          <div className="hg-sheet__body">{children}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
