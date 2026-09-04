import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { personaFixture } from '@/test/persona-fixture';
import { renderApp } from '@/test/render';
import { PreviewStep } from './preview-step';

describe('PreviewStep', () => {
  it('lists missing steps and disables Start until ready', () => {
    renderApp(
      <PreviewStep
        persona={personaFixture()}
        busy={false}
        onActivate={vi.fn()}
        onPause={vi.fn()}
        onArchive={vi.fn()}
      />,
    );
    expect(screen.getByTestId('missing')).toHaveTextContent('Voice bible: who is speaking');
    expect(screen.getByTestId('start')).toBeDisabled();
  });

  it('starts a ready draft, pauses a warming persona, archives', async () => {
    const onActivate = vi.fn();
    const onPause = vi.fn();
    const onArchive = vi.fn();
    const { rerender } = renderApp(
      <PreviewStep
        persona={personaFixture({ missingForStart: [] })}
        busy={false}
        onActivate={onActivate}
        onPause={onPause}
        onArchive={onArchive}
      />,
    );
    expect(screen.getByTestId('ready')).toHaveTextContent('Ready to start');
    await userEvent.click(screen.getByTestId('start'));
    expect(onActivate).toHaveBeenCalledOnce();
    rerender(
      <PreviewStep
        persona={personaFixture({ missingForStart: [], status: 'warming' })}
        busy={false}
        onActivate={onActivate}
        onPause={onPause}
        onArchive={onArchive}
      />,
    );
    await userEvent.click(screen.getByTestId('pause'));
    expect(onPause).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByTestId('archive'));
    expect(onArchive).toHaveBeenCalledOnce();
    expect(screen.queryByTestId('start')).toBeNull();
  });
});
