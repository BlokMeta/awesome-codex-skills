import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '@/test/render';
import { routerMock } from '@/test/setup';
import { LanguageSwitch } from './language-switch';

describe('LanguageSwitch', () => {
  it('lists user-facing locales, writes the cookie and refreshes', async () => {
    renderApp(<LanguageSwitch current="tr" />);
    const select = screen.getByRole('combobox', { name: 'Language' });
    expect(select).toHaveValue('tr');
    expect(screen.queryByRole('option', { name: /pseudo/i })).toBeNull();
    await userEvent.selectOptions(select, 'en');
    expect(document.cookie).toContain('hg.locale=en');
    expect(routerMock.refresh).toHaveBeenCalled();
  });
});
