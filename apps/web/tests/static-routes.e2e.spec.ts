import { expect, test } from '@playwright/test';

const canonicalRoutes = [
  '/',
  '/atlas/solenopsis-invicta',
  '/atlas/phyllobates-terribilis',
  '/atlas/oxyuranus-microlepidotus',
  '/atlas/synanceia-verrucosa',
  '/atlas/ornithorhynchus-anatinus',
  '/organisms',
  '/organisms/solenopsis-invicta',
  '/organisms/solenopsis-invicta/toxic-material',
  '/organisms/solenopsis-invicta/venom',
  '/organisms/phyllobates-terribilis/toxic-material',
  '/organisms/phyllobates-terribilis/geography',
  '/toxins/solenopsin-a',
  '/toxins/batrachotoxin',
  '/toxins/batrachotoxin/mechanism',
  '/effects',
  '/sources',
];

const unsupportedCompoundClaimRoutes = [
  '/toxins/solenopsin-a/mechanism',
  '/toxins/solenopsin-a/physiology',
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

test('does not publish organism-exposure claims as isolated-compound routes', async ({ page }) => {
  for (const route of unsupportedCompoundClaimRoutes) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: /not found/i })).toBeVisible();
  }
});

test('does not publish internal editorial citations', async ({ page }) => {
  await page.goto('/sources');
  await expect(page.getByText('Editorial normalization for scaffold continuity')).toHaveCount(0);

  const response = await page.goto('/sources/editorial-placeholder');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: /not found/i })).toBeVisible();
});

test('organism selection starts lightweight and opens the canonical monopage', async ({ page }) => {
  const externalRequests: string[] = [];
  page.on('request', (request) => {
    const hostname = new URL(request.url()).hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '::1') {
      externalRequests.push(request.url());
    }
  });

  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'Choose an organism to explore' })).toBeVisible();
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('canvas')).toHaveCount(0);
  expect(externalRequests).toEqual([]);

  await page.getByRole('link', { name: /Red imported fire ant/ }).click();
  await expect(page).toHaveURL(/\/atlas\/solenopsis-invicta(?:\?|#|$)/);
  await expect(page.getByRole('heading', { level: 1, name: 'Solenopsis invicta' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Change organism' })).toBeVisible();
});

test('chooser spans five organism classes and poison dossiers preserve material scope', async ({ page }) => {
  await page.goto('/');

  for (const name of [
    'Red imported fire ant',
    'Golden poison frog',
    'Inland taipan',
    'Reef stonefish',
    'Platypus',
  ]) {
    await expect(page.getByRole('link', { name: new RegExp(name) })).toBeVisible();
  }

  await page.getByRole('link', { name: /Golden poison frog/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Phyllobates terribilis' })).toBeVisible();
  await expect(page.getByText('Amphibia · poisonous')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Chemistry and structure' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Toxin Categorization' })).toBeVisible();
  await expect(page.getByText('Batrachotoxin', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Missing modules are omitted until source-backed records are curated.')).toBeVisible();
});

test('organism catalog supports search and kingdom/strategy filters', async ({ page }) => {
  await page.goto('/organisms');

  await expect(page.getByRole('heading', { level: 1, name: 'Organisms' })).toBeVisible();
  await expect(page.getByText('15 of 15 organisms')).toBeVisible();

  await page.getByRole('searchbox', { name: 'Search' }).fill('ricin');
  await expect(page.getByRole('link', { name: 'Castor bean plant' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Red imported fire ant' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Clear filters' }).click();
  await page.getByLabel('Kingdom').selectOption('Plantae');
  await expect(page.getByText('2 of 15 organisms')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Castor bean plant' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Jimsonweed' })).toBeVisible();

  await page.getByLabel('Kingdom').selectOption('');
  await page.getByLabel('Strategy').selectOption('toxin_producing');
  await expect(page.getByText('1 of 15 organisms')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Botulinum neurotoxin-producing bacterium' })).toBeVisible();
  await expect(page.getByText('toxin-producing', { exact: true })).toBeVisible();
});

test('poison material uses its canonical route without publishing a venom alias', async ({ page }) => {
  await page.goto('/organisms/phyllobates-terribilis');

  await expect(page.getByRole('link', { name: /toxic material profile/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /geography profile/i })).toBeVisible();

  expect((await page.goto('/organisms/phyllobates-terribilis/toxic-material'))?.status()).toBe(200);
  await expect(page.getByText('Material kind: poison')).toBeVisible();
  expect((await page.goto('/organisms/phyllobates-terribilis/venom'))?.status()).toBe(404);
  expect((await page.goto('/organisms/phyllobates-terribilis/geography'))?.status()).toBe(200);
});

test('first-party geography renders occurrence records without external requests', async ({ page }) => {
  const externalRequests: string[] = [];
  page.on('request', (request) => {
    const hostname = new URL(request.url()).hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '::1') {
      externalRequests.push(request.url());
    }
  });

  await page.goto('/atlas/phyllobates-terribilis#section-geography');
  await expect(page.getByRole('link', { name: 'Geography', exact: true })).toBeVisible();
  const map = page.getByRole('img', { name: /world map showing 2 occurrence records/i });
  await expect(map).toBeVisible();
  await expect(page.getByText(/observations indicate recorded presence/i)).toBeVisible();
  expect(await map.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  expect(externalRequests).toEqual([]);
});

test('geography map exposes local layers and focus-gated wheel zoom', async ({ page }) => {
  await page.goto('/organisms/solenopsis-invicta/geography');

  const map = page.locator('.openlayers-geography-map');
  await expect(map).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'all administrative regions' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'national borders' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'native regions' })).toBeChecked();
  await expect(page.getByText('Click the map to enable scroll zoom.')).toBeVisible();

  await map.locator('.openlayers-geography-map-canvas').click({ position: { x: 240, y: 140 } });
  await expect(page.getByText('Click the map to enable scroll zoom.')).toHaveCount(0);

  await page.getByRole('heading', { name: 'Ecology and geography' }).click();
  await expect(page.getByText('Click the map to enable scroll zoom.')).toBeVisible();
});

test('geography map explains when only neutral boundaries are available', async ({ page }) => {
  await page.route('**/data/geography/distribution-registry.json', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ dataset: 'geoBoundaries', release: 'test', records: [] }),
    });
  });
  await page.route('**/geography/solenopsis-invicta-occurrences.geojson', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ type: 'FeatureCollection', features: [] }),
    });
  });

  await page.goto('/organisms/solenopsis-invicta/geography');
  await expect(page.getByText(/No species-specific geography evidence is available/)).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'all administrative regions' })).toBeVisible();
});

test('organism monopage does not overflow a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/atlas/solenopsis-invicta');

  const dimensions = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    contentWidth: document.documentElement.scrollWidth,
  }));

  expect(dimensions.contentWidth).toBe(dimensions.viewportWidth);
});
