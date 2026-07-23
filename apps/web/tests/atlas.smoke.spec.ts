import { expect, test } from '@playwright/test';

test('organism to molecule smoke flow', async ({ page }) => {
  await page.goto('/organisms/solenopsis-invicta');
  await expect(page.getByRole('heading', { name: /Solenopsis invicta/i })).toBeVisible();

  await page.getByRole('link', { name: /View Solenopsin A molecule page/i }).click();

  await expect(page.getByRole('heading', { name: /Solenopsin A/i })).toBeVisible();
  await expect(page.getByRole('region', { name: /Molecular viewer/i })).toBeVisible();
});
