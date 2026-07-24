import { expect, test } from '@playwright/test';

const canonicalRoutes = [
  '/',
  '/organisms',
  '/organisms/solenopsis-invicta',
  '/organisms/solenopsis-invicta/venom',
  '/toxins/solenopsin-a',
  '/toxins/solenopsin-a/mechanism',
  '/toxins/solenopsin-a/physiology',
  '/organisms/solenopsis-invicta/geography',
  '/sources',
];

test('canonical static routes render meaningful HTML without /api requests', async ({ page }) => {
  const apiRequests: string[] = [];

  page.on('request', (request) => {
    if (request.url().includes('/api/')) {
      apiRequests.push(request.url());
    }
  });

  for (const route of canonicalRoutes) {
    await page.goto(route);
    await expect(page.getByRole('heading').first()).toBeVisible();

    const html = await page.content();
    expect(html.length).toBeGreaterThan(300);
  }

  expect(apiRequests).toEqual([]);
});

test('unknown routes show not-found behavior', async ({ page }) => {
  await page.goto('/not-a-real-route');
  await expect(page.getByRole('heading', { name: /not found/i })).toBeVisible();
});
