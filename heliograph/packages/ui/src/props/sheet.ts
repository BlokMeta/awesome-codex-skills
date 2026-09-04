import type { TestableProps } from './common.js';

export interface SheetProps extends TestableProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  readonly description?: string | undefined;
  /** Accessible name of the close control ("Kapat"). */
  readonly closeLabel: string;
  /** `end` = side panel from the inline end (web default); `bottom` = mobile-style sheet. */
  readonly side?: 'end' | 'bottom' | undefined;
}
