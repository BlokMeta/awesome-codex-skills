import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { Button, IconButton } from './Button.js';

describe('Button', () => {
  it('renders the label, fires onPress with mouse and keyboard, passes axe', async () => {
    const onPress = vi.fn();
    const { container } = render(<Button label="Yayınla" variant="primary" onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Yayınla' });
    await userEvent.click(button);
    button.focus();
    await userEvent.keyboard('{Enter}');
    expect(onPress).toHaveBeenCalledTimes(2);
    expect(button).toHaveAttribute('data-variant', 'primary');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('blocks presses while disabled or loading and exposes busy state', async () => {
    const onPress = vi.fn();
    const { rerender } = render(<Button label="Kaydet" disabled onPress={onPress} />);
    await userEvent.click(screen.getByRole('button'));
    rerender(<Button label="Kaydet" loading onPress={onPress} />);
    const busy = screen.getByRole('button');
    expect(busy).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(busy);
    expect(onPress).not.toHaveBeenCalled();
    expect(busy.querySelector('.hg-button__spinner')).not.toBeNull();
  });

  it('renders icon, flash and size data attributes', () => {
    render(<Button label="Flaş" flash size="lg" icon={<svg aria-hidden="true" />} testID="b" />);
    const b = screen.getByTestId('b');
    expect(b).toHaveAttribute('data-flash', 'true');
    expect(b).toHaveAttribute('data-size', 'lg');
    expect(b.querySelector('.hg-button__icon svg')).not.toBeNull();
  });
});

describe('IconButton', () => {
  it('has an accessible name and no axe violations', async () => {
    const onPress = vi.fn();
    const { container } = render(
      <IconButton icon={<svg aria-hidden="true" />} accessibilityLabel="Kapat" onPress={onPress} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Kapat' }));
    expect(onPress).toHaveBeenCalledOnce();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('ignores presses when disabled', async () => {
    const onPress = vi.fn();
    render(<IconButton icon={<span />} accessibilityLabel="Sil" disabled onPress={onPress} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
