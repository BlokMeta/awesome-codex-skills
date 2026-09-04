import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { Sheet } from './Sheet.js';

describe('Sheet', () => {
  it('opens as a modal dialog named by its title and closes via button and Escape', async () => {
    const onOpenChange = vi.fn();
    render(
      <Sheet
        open
        onOpenChange={onOpenChange}
        title="Kapı raporu"
        description="8 katman"
        closeLabel="Kapat"
      >
        <p>İçerik</p>
      </Sheet>,
    );
    const dialog = await screen.findByRole('dialog', { name: 'Kapı raporu' });
    expect(dialog).toHaveAccessibleDescription('8 katman');
    expect(dialog).toHaveAttribute('data-side', 'end');
    await userEvent.click(screen.getByRole('button', { name: 'Kapat' }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await userEvent.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledTimes(2);
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('renders nothing while closed and supports the bottom side', () => {
    const { rerender } = render(
      <Sheet
        open={false}
        onOpenChange={() => undefined}
        title="Gizli"
        closeLabel="Kapat"
        side="bottom"
      />,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    rerender(
      <Sheet open onOpenChange={() => undefined} title="Alt" closeLabel="Kapat" side="bottom" />,
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('data-side', 'bottom');
  });
});
