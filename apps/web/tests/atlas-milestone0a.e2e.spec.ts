import { expect, test } from '@playwright/test';
import { dossierSections, expectAnchorClear, expectNoHorizontalOverflow, expectSubstantiveDossier } from './helpers/atlas-dossier-browser';

const legacyBookmarks = {
  'section-organism-profile': 'section-summary',
  'section-mechanisms': 'section-medical-effects',
  'section-toxin-categorization': 'section-chemistry',
  'section-toxin-charts': 'section-chemistry',
  'section-human-physiology': 'section-medical-effects',
};

test('four substantive sections and locally usable sources, with non-human applicability visible', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto('/');
  await expectSubstantiveDossier(page);
  const claims = {
    'section-summary': ['Fixture organism overview.', 'Fixture natural history.', 'Fixture ecology description.', 'Fixture delivery summary.'],
    'section-geography': ['Fixture range description.', 'Fixture source precision limitation.', 'Fixture habitat description.'],
    'section-chemistry': ['Fixture material description.', 'Fixture component description.', 'Fixture toxin description.', 'Fixture target description.', 'molecular-step description', 'compound-step description'],
    'section-medical-effects': ['exposure-step description', 'clinical-step description', 'Fixture effect description.', 'Fixture symptom description.'],
  };
  const citations = {
    'section-summary': ['organism', 'delivery', 'ecology'],
    'section-geography': ['range', 'audit', 'habitat'],
    'section-chemistry': ['material', 'component', 'toxin', 'identity', 'structure', 'target', 'molecular-step', 'compound-step'],
    'section-medical-effects': ['exposure-step', 'clinical-step', 'effect', 'symptom'],
  };
  // Use the actual disclosures, not a DOM-only assertion against permanently hidden content.
  for (const disclosure of await page.locator('.atlas-disclosure').all()) {
    if (await disclosure.getAttribute('open') === null) await disclosure.locator(':scope > summary').click();
  }
  for (const [id, texts] of Object.entries(claims)) {
    for (const text of texts) {
      const matches = page.getByText(text, { exact: true });
      await expect(matches.first()).toBeVisible();
      for (const match of await matches.all()) {
        expect(await match.evaluate((node) => node.closest('[data-scroll-section]')?.id), text).toBe(id);
      }
    }
    for (const citation of citations[id as keyof typeof citations]) {
      const sources = page.locator(`#${id} .atlas-local-sources`).filter({ hasText: `${citation} reference` });
      expect(await sources.count(), `${citation}: local source disclosure`).toBeGreaterThan(0);
      for (const source of await sources.all()) {
        for (const parent of await source.locator('xpath=ancestor::details[not(@open)]').all()) {
          await parent.locator(':scope > summary').click();
        }
        if (await source.getAttribute('open') === null) await source.locator(':scope > summary').click();
        await expect(source.getByRole('link', { name: 'Source', exact: true })).toHaveAttribute('href', `https://example.org/${citation}`);
        await expect(source.getByRole('link', { name: 'Source', exact: true })).toBeVisible();
      }
    }
    await expectNoHorizontalOverflow(page);
  }
  const medical = page.getByRole('region', { name: 'Medical Effects', exact: true });
  await expect(medical.getByRole('heading', { name: 'Evidence applicability: Non-human' })).toBeVisible();
  await expect(medical.getByText('Synthetic non-human evidence only; human medical effects are not established by this fixture.')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Delivery sequence' }).getByRole('listitem')).toHaveCount(6);
  const image = page.getByRole('img', { name: '2D skeletal structure for Fixture toxin' });
  await expect.poll(() => image.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('canonical anchors clear sticky header/nav and preserve toxin query; capture all four sections', async ({ page }, testInfo) => {
  await page.goto('/?toxin=second-fixture-toxin&keep=yes#section-summary');
  await expect(page.getByLabel('Chemical component selector')).toHaveValue('second-fixture-toxin');
  for (const { id, title } of dossierSections) {
    await page.getByRole('navigation', { name: 'Organism sections' }).getByRole('link', { name: title, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`\\?toxin=second-fixture-toxin&keep=yes#${id}$`));
    await expectAnchorClear(page, id);
    if (id === 'section-geography') await expect(page.locator('.ol-viewport')).toBeVisible();
    const screenshot = testInfo.outputPath(`${testInfo.project.name}-${id}.png`);
    await page.screenshot({ path: screenshot, animations: 'disabled' });
    await testInfo.attach(`${testInfo.project.name}-${title}`, { path: screenshot, contentType: 'image/png' });
  }
  await page.getByRole('navigation', { name: 'Organism sections' }).getByRole('link', { name: 'Chemistry', exact: true }).click();
  await page.getByLabel('Chemical component selector').selectOption('fixture-toxin');
  await expect(page).toHaveURL(/\?toxin=fixture-toxin&keep=yes#section-chemistry$/);
  await page.reload();
  await expect(page.getByLabel('Chemical component selector')).toHaveValue('fixture-toxin');
  await expectAnchorClear(page, 'section-chemistry');
});

for (const [alias, canonical] of Object.entries(legacyBookmarks)) {
  test(`migrates ${alias} on load and hashchange without losing query state`, async ({ page }) => {
    await page.goto(`/?toxin=second-fixture-toxin&keep=yes#${alias}`);
    await expect(page).toHaveURL(new RegExp(`\\?toxin=second-fixture-toxin&keep=yes#${canonical}$`));
    await expect(page.getByLabel('Chemical component selector')).toHaveValue('second-fixture-toxin');
    await expectAnchorClear(page, canonical);
    // Exercise an old incoming same-document bookmark, including reopening material details.
    await page.locator('#chemistry-material').evaluate((node) => { (node as HTMLDetailsElement).open = false; });
    await page.evaluate((bookmark) => { location.hash = bookmark; }, alias.replace('section-', ''));
    await expect(page).toHaveURL(new RegExp(`#${canonical}$`));
    await expectAnchorClear(page, canonical);
    expect(new URL(page.url()).search).toBe('?toxin=second-fixture-toxin&keep=yes');
    if (/toxin-(charts|categorization)/.test(alias)) await expect(page.locator('#chemistry-material')).toHaveAttribute('open', '');
  });
}

test('back/forward restores section and selected toxin without stripping unrelated query parameters', async ({ page }) => {
  await page.goto('/?toxin=second-fixture-toxin&keep=yes#section-summary');
  await expect(page.getByLabel('Chemical component selector')).toHaveValue('second-fixture-toxin');
  const nav = page.getByRole('navigation', { name: 'Organism sections' });
  await nav.getByRole('link', { name: 'Chemistry', exact: true }).click();
  await page.getByLabel('Chemical component selector').selectOption('fixture-toxin');
  await nav.getByRole('link', { name: 'Medical Effects', exact: true }).click();
  await page.goBack();
  await expectAnchorClear(page, 'section-chemistry');
  await page.goBack();
  await expectAnchorClear(page, 'section-summary');
  await expect(page.getByLabel('Chemical component selector')).toHaveValue('second-fixture-toxin');
  await page.goForward();
  await expectAnchorClear(page, 'section-chemistry');
  await expect(page.getByLabel('Chemical component selector')).toHaveValue('fixture-toxin');
  expect(new URL(page.url()).searchParams.get('keep')).toBe('yes');
});

test('SSR retains all four substantive sections without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(test.info().project.use.baseURL!);
  await expectSubstantiveDossier(page);
  await context.close();
});