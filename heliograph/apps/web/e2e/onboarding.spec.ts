import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const password = 'correct horse battery staple';

test.describe('onboarding: sign-up → consents → workspace → today → sign-out → sign-in', () => {
  test('a new operator reaches Today with a workspace and can sign back in', async ({ page }) => {
    const stamp = Date.now().toString(36);
    const email = `e2e-${stamp}@example.com`;

    await page.goto('/');
    await expect(page).toHaveURL(/\/sign-in\?next=%2F$/);
    await expect(await new AxeBuilder({ page }).analyze()).toHaveProperty('violations', []);

    await page.getByRole('link', { name: 'Hesap oluştur' }).click();
    await page.getByTestId('name').fill('Ayşe E2E');
    await page.getByTestId('email').fill(email);
    await page.getByTestId('password').fill(password);
    await page.getByTestId('submit').click();

    await expect(page).toHaveURL(/\/consents$/);
    const docs = page.getByTestId('pending-docs').locator('li');
    await expect(docs).toHaveCount(4);
    await expect(await new AxeBuilder({ page }).analyze()).toHaveProperty('violations', []);
    await page.getByTestId('accept').click();

    await expect(page).toHaveURL(/\/workspaces\/new$/);
    await page.getByTestId('name').fill(`Atölye E2E ${stamp}`);
    await expect(page.getByTestId('slug')).toHaveValue(`atolye-e2e-${stamp}`);
    await page.getByTestId('submit').click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('welcome')).toHaveText('Hoş geldin, Ayşe E2E');
    await expect(page.getByTestId('active-workspace')).toContainText(`Atölye E2E ${stamp}`);
    await expect(page.getByTestId('plan')).toHaveText('Plan: Free');
    await expect(page.getByTestId('credits')).toHaveText('Medya kredisi yok');
    await expect(await new AxeBuilder({ page }).analyze()).toHaveProperty('violations', []);

    await page.getByTestId('sign-out').click();
    await expect(page).toHaveURL(/\/sign-in$/);

    await page.getByTestId('email').fill(email);
    await page.getByTestId('password').fill('wrong password here');
    await page.getByTestId('submit').click();
    await expect(page.getByText('E-posta veya parola hatalı.')).toBeVisible();

    await page.getByTestId('password').fill(password);
    await page.getByTestId('submit').click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('welcome')).toHaveText('Hoş geldin, Ayşe E2E');
  });

  test('language switch re-renders the shell in English', async ({ page, context }) => {
    await context.addCookies([{ name: 'hg.locale', value: 'en', url: 'http://127.0.0.1:3100' }]);
    await page.goto('/sign-in');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});
