import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { personaFixture } from '@/test/persona-fixture';
import { renderApp } from '@/test/render';
import { PolicyStep } from './policy-step';

describe('PolicyStep', () => {
  it('edits ranges, toggles weekdays, adds a window and saves all three policies', async () => {
    const onSave = vi.fn();
    renderApp(<PolicyStep persona={personaFixture()} busy={false} onSave={onSave} />);
    await userEvent.clear(screen.getByTestId('dailyPosts-max'));
    await userEvent.type(screen.getByTestId('dailyPosts-max'), '8');
    await userEvent.click(screen.getByRole('button', { name: 'Sat', pressed: false }));
    await userEvent.click(screen.getByRole('button', { name: 'Add window' }));
    expect(screen.getByTestId('window-1')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('auto-reply'));
    await userEvent.selectOptions(screen.getByTestId('human-review'), 'first_30_days');
    await userEvent.click(screen.getByTestId('step-next'));
    const patch = onSave.mock.calls[0]?.[0];
    expect(patch.postingPolicy.dailyPosts).toEqual({ min: 3, max: 8 });
    expect(patch.postingPolicy.windows[0].days).toEqual([1, 2, 3, 4, 5, 6]);
    expect(patch.postingPolicy.windows).toHaveLength(2);
    expect(patch.engagementPolicy.autoReply).toBe(true);
    expect(patch.qualityPolicy.humanReview).toBe('first_30_days');
  });

  it('blocks saving when a window is inverted or min exceeds max', async () => {
    const onSave = vi.fn();
    renderApp(<PolicyStep persona={personaFixture()} busy={false} onSave={onSave} />);
    await userEvent.clear(screen.getByTestId('window-0-to'));
    await userEvent.type(screen.getByTestId('window-0-to'), '08:00');
    expect(screen.getByTestId('step-next')).toBeDisabled();
    await userEvent.clear(screen.getByTestId('window-0-to'));
    await userEvent.type(screen.getByTestId('window-0-to'), '12:00');
    await userEvent.clear(screen.getByTestId('dailyPosts-min'));
    await userEvent.type(screen.getByTestId('dailyPosts-min'), '9');
    expect(screen.getByTestId('step-next')).toBeDisabled();
    expect(onSave).not.toHaveBeenCalled();
  });
});
