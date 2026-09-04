import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { SelectField } from './SelectField.js';
import { TagInput } from './TagInput.js';

describe('SelectField', () => {
  it('is a labelled combobox that reports changes and passes axe', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <SelectField
        label="Alan"
        hint="Personanın uzmanlığı"
        value="devops"
        onChange={onChange}
        options={[
          { value: 'devops', label: 'DevOps' },
          { value: 'ai', label: 'AI' },
        ]}
        required
      />,
    );
    const select = screen.getByRole('combobox', { name: /Alan/ });
    expect(select).toHaveAccessibleDescription('Personanın uzmanlığı');
    await userEvent.selectOptions(select, 'ai');
    expect(onChange).toHaveBeenCalledWith('ai');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('marks invalid state with an error message', () => {
    render(
      <SelectField
        label="X"
        value="a"
        onChange={() => undefined}
        options={[{ value: 'a', label: 'A' }]}
        error="Seç"
      />,
    );
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Seç');
  });
});

describe('TagInput', () => {
  it('adds on Enter/comma, ignores duplicates, removes via button and Backspace, passes axe', async () => {
    const onChange = vi.fn();
    const { container, rerender } = render(
      <TagInput
        label="Ton"
        values={[]}
        onChange={onChange}
        removeLabel={(v) => `${v} kaldır`}
        hint="Enter ile ekle"
      />,
    );
    const input = screen.getByLabelText(/Ton/);
    await userEvent.type(input, 'kuru{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['kuru']);
    rerender(
      <TagInput
        label="Ton"
        values={['kuru']}
        onChange={onChange}
        removeLabel={(v) => `${v} kaldır`}
      />,
    );
    await userEvent.type(screen.getByLabelText(/Ton/), 'kuru,');
    expect(onChange).toHaveBeenCalledTimes(1);
    await userEvent.type(screen.getByLabelText(/Ton/), 'somut,');
    expect(onChange).toHaveBeenLastCalledWith(['kuru', 'somut']);
    await userEvent.click(screen.getByRole('button', { name: 'kuru kaldır' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
    await userEvent.type(screen.getByLabelText(/Ton/), '{Backspace}');
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('commits on blur and stops at max', async () => {
    const onChange = vi.fn();
    render(
      <TagInput label="T" values={['a', 'b']} onChange={onChange} removeLabel={(v) => v} max={2} />,
    );
    expect(screen.getByLabelText(/T/)).toBeDisabled();
    const { rerender } = render(
      <TagInput label="U" values={[]} onChange={onChange} removeLabel={(v) => v} />,
    );
    await userEvent.type(screen.getByLabelText(/U/), 'meraklı');
    await userEvent.tab();
    expect(onChange).toHaveBeenLastCalledWith(['meraklı']);
    rerender(
      <TagInput
        label="U"
        values={[]}
        onChange={onChange}
        removeLabel={(v) => v}
        error="Bir ton ekle"
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Bir ton ekle');
  });
});
