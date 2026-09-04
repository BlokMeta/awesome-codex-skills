import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const password = 'correct horse battery staple';

test('persona wizard: create, write the voice bible, review policy, start (warming)', async ({
  page,
}) => {
  const stamp = Date.now().toString(36);
  await page.goto('/sign-up');
  await page.getByTestId('name').fill('Persona E2E');
  await page.getByTestId('email').fill(`persona-${stamp}@example.com`);
  await page.getByTestId('password').fill(password);
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/consents$/);
  await page.getByTestId('accept').click();
  await expect(page).toHaveURL(/\/workspaces\/new$/);
  await page.getByTestId('name').fill(`Stüdyo ${stamp}`);
  await page.getByTestId('submit').click();
  await expect(page.getByTestId('welcome')).toBeVisible();

  await page.getByRole('link', { name: 'Personalar' }).click();
  await expect(page.getByTestId('personas-empty')).toBeVisible();
  await page.getByTestId('new-persona').click();
  await expect(page).toHaveURL(/\/personas\/new$/);
  await page.getByTestId('p-name').fill('Deniz Işık');
  await expect(page.getByTestId('p-slug')).toHaveValue('deniz-isik');
  await page.getByTestId('p-submit').click();
  await expect(page).toHaveURL(/\/personas\/[^/]+\/wizard\?step=voice$/);
  await expect(await new AxeBuilder({ page }).analyze()).toHaveProperty('violations', []);

  await page
    .getByTestId('v-summary')
    .fill('Platform mühendisi; Kubernetes ve CI/CD üzerine somut, kısa deneyim notları paylaşır.');
  await page.getByTestId('v-tone').locator('input').fill('kuru');
  await page.getByTestId('v-tone').locator('input').press('Enter');
  await page.getByTestId('v-topics').locator('input').fill('kubernetes');
  await page.getByTestId('v-topics').locator('input').press('Enter');
  await page.getByTestId('step-next').click();
  await expect(page).toHaveURL(/step=visual$/);
  await expect(page.getByText('Kaydedildi')).toBeVisible();
  await page.getByTestId('step-next').click();
  await expect(page).toHaveURL(/step=channels$/);
  await page.getByTestId('step-next').click();
  await expect(page).toHaveURL(/step=policy$/);
  await expect(await new AxeBuilder({ page }).analyze()).toHaveProperty('violations', []);
  await page.getByTestId('step-next').click();
  await expect(page).toHaveURL(/step=preview$/);
  await expect(page.getByTestId('ready')).toBeVisible();
  await page.getByTestId('start').click();
  await expect(page.getByText('Isınıyor')).toBeVisible();
  await expect(page.getByTestId('pause')).toBeVisible();

  await page.getByRole('link', { name: 'Personalar' }).click();
  await expect(page.getByTestId('personas-list')).toContainText('Deniz Işık');
  await expect(page.getByTestId('personas-list')).toContainText('Isınıyor');
});
