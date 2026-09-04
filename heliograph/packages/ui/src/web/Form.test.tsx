import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { Switch } from './Switch.js';
import { TextInput } from './TextInput.js';

describe('TextInput', () => {
  it('associates label, hint and error; reports typing; passes axe', async () => {
    const onChangeText = vi.fn();
    const { container, rerender } = render(
      <TextInput
        label="E-posta"
        hint="İş e-postanı kullan"
        kind="email"
        value=""
        onChangeText={onChangeText}
        required
      />,
    );
    const input = screen.getByLabelText(/E-posta/);
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toBeRequired();
    expect(input).toHaveAccessibleDescription('İş e-postanı kullan');
    await userEvent.type(input, 'a');
    expect(onChangeText).toHaveBeenCalledWith('a');
    expect(await axe(container)).toHaveNoViolations();

    rerender(
      <TextInput label="E-posta" value="x" onChangeText={onChangeText} error="Geçersiz adres" />,
    );
    expect(screen.getByLabelText(/E-posta/)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Geçersiz adres')).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders a textarea when multiline and honours disabled', () => {
    render(
      <TextInput
        label="Not"
        value=""
        onChangeText={() => undefined}
        multiline
        disabled
        testID="t"
      />,
    );
    const area = screen.getByTestId('t');
    expect(area.tagName).toBe('TEXTAREA');
    expect(area).toBeDisabled();
  });
});

describe('Switch', () => {
  it('is a labelled switch that toggles and passes axe', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Switch
        label="Otomatik yayın"
        description="Kapı geçen içerik onaysız yayınlanır"
        checked={false}
        onChange={onChange}
      />,
    );
    const sw = screen.getByRole('switch', { name: 'Otomatik yayın' });
    expect(sw).toHaveAccessibleDescription('Kapı geçen içerik onaysız yayınlanır');
    expect(sw).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('does not toggle when disabled', async () => {
    const onChange = vi.fn();
    render(<Switch label="Kilit" checked onChange={onChange} disabled />);
    await userEvent.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
