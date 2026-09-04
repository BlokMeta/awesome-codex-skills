import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { personaFixture } from '@/test/persona-fixture';
import { renderApp } from '@/test/render';
import { VoiceStep } from './voice-step';

describe('VoiceStep', () => {
  it('collects the voice bible and topics, splitting sample posts by line, and passes axe', async () => {
    const onSave = vi.fn();
    const { container } = renderApp(
      <VoiceStep persona={personaFixture()} busy={false} onSave={onSave} />,
    );
    await userEvent.type(
      screen.getByLabelText(/Who is speaking/),
      'Platform engineer sharing concrete Kubernetes notes, short and dry, never hype.',
    );
    await userEvent.type(screen.getByLabelText(/^Tone words/), 'dry{Enter}concrete{Enter}');
    await userEvent.selectOptions(screen.getByLabelText(/^Register/), 'casual');
    await userEvent.type(
      screen.getByLabelText(/^Sample posts/),
      'helm upgrade --atomic saves nights.\n\nsecond post',
    );
    await userEvent.type(screen.getByLabelText(/^Topics to cover/), 'kubernetes{Enter}');
    await userEvent.click(screen.getByTestId('step-next'));
    expect(onSave).toHaveBeenCalledOnce();
    const patch = onSave.mock.calls[0]?.[0];
    expect(patch.voiceBible.tone).toEqual(['dry', 'concrete']);
    expect(patch.voiceBible.register).toBe('casual');
    expect(patch.voiceBible.samplePosts).toEqual([
      'helm upgrade --atomic saves nights.',
      'second post',
    ]);
    expect(patch.topicProfile.include).toEqual(['kubernetes']);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('flags a summary under 40 characters', async () => {
    renderApp(<VoiceStep persona={personaFixture()} busy={false} onSave={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/Who is speaking/), 'too short');
    expect(screen.getByLabelText(/Who is speaking/)).toHaveAttribute('aria-invalid', 'true');
  });
});
