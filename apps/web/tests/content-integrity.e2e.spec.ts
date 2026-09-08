import { expect, test } from '@playwright/test';
import { getAllRoutes, getContentRecords, getPublicCitations } from '../src/lib/content';

test('every inventoried public page is reachable in production', async ({ request }) => {
  for (const route of getAllRoutes().filter((entry) => entry !== '/404')) {
    const response = await request.get(route);
    expect(response.status(), route).toBe(200);
    // Astro's static redirect documents intentionally omit an explicit html tag.
    expect(await response.text(), route).toMatch(/<!doctype html>/i);
  }
});

test('Redback source aliases publish only when relevant to an eligible dossier', async ({ page, request }) => {
  const rawSources = getContentRecords().citations.filter((entry) => entry.id === 'cit-australian-museum-redback');
  expect(rawSources).toHaveLength(1);
  const publicSources = getPublicCitations().filter((entry) => entry.id === rawSources[0]!.id);
  if (publicSources.length === 0) {
    for (const slug of [rawSources[0]!.slug, ...rawSources[0]!.aliases]) {
      expect((await request.get(`/sources/${slug}`)).status()).toBe(404);
    }
    return;
  }
  await page.goto('/sources/australian-museum-redback');
  await expect(page).toHaveURL(/\/sources\/australian-museum-redback-spider\/?$/);
  await expect(page.getByRole('link', { name: 'Open source', exact: true }))
    .toHaveAttribute('href', 'https://australian.museum/learn/animals/spiders/redback-spider/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/sources\/australian-museum-redback-spider\/?$/);
  await page.goto('/sources');
  expect(getPublicCitations().filter((entry) => entry.id === 'cit-australian-museum-redback')).toHaveLength(1);
  await expect(page.locator('a[href$="/sources/australian-museum-redback-spider"]')).toHaveCount(1);
  await expect(page.locator('a[href$="/sources/australian-museum-redback"]')).toHaveCount(0);
});

test('deduplication preserves exposure scope and internal citation privacy', async ({ request }) => {
  for (const route of ['/toxins/solenopsin-a/mechanism', '/toxins/solenopsin-a/physiology', '/sources/editorial-placeholder']) {
    expect((await request.get(route)).status(), route).toBe(404);
  }
  const route = '/atlas/solenopsis-invicta';
  expect((await request.get(route)).status()).toBe(getAllRoutes().includes(route) ? 200 : 404);
});