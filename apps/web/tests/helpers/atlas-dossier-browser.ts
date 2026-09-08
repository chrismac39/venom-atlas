import { expect, type Page } from '@playwright/test';

// Intentionally independent of atlasSections: changing the product contract must fail the tests.
export const dossierSections = [
  { id: 'section-summary', title: 'Summary' },
  { id: 'section-geography', title: 'Geography' },
  { id: 'section-chemistry', title: 'Chemistry' },
  { id: 'section-medical-effects', title: 'Medical Effects' },
] as const;

/** Shared by the isolated synthetic site AND every real public organism dossier. */
export async function expectSubstantiveDossier(page: Page) {
  const dossier = page.locator('article.atlas-dossier');
  await expect(dossier).toBeVisible();
  await expect(dossier.getByRole('heading', { level: 2 })).toHaveText(dossierSections.map(({ title }) => title));
  await expect(dossier.locator(':scope > section')).toHaveCount(4);
  const links = dossier.getByRole('navigation', { name: 'Organism sections' }).getByRole('link');
  await expect(links).toHaveText(dossierSections.map(({ title }) => title));
  for (const [index, { id, title }] of dossierSections.entries()) {
    await expect(links.nth(index)).toHaveAttribute('href', `#${id}`);
    const section = dossier.locator(':scope > section').nth(index);
    await expect(section).toHaveAttribute('id', id);
    await expect(section).toHaveAttribute('aria-labelledby', `${id}-heading`);
    await expect(section.getByRole('heading', { name: title, exact: true })).toBeVisible();
    // A heading, badge or empty-state sentence alone is not substantive section content.
    const paragraphs = await section.locator('.atlas-scroll-section-content p:not(.atlas-section-eyebrow):not(.evidence-badge)').allTextContents();
    expect(paragraphs.some((text) => text.trim().length >= 20 && !/pending|not yet sourced|unavailable|not available|could not|loading|No source citations/i.test(text)), id).toBe(true);
    expect(await section.locator('.atlas-local-sources a[href]').count(), `${id}: claim-local citations`).toBeGreaterThan(0);
    await expect(section).not.toContainText('No source citations linked.');
  }
  await expect(dossier.locator('#section-summary .atlas-organism-lede')).not.toBeEmpty();
  await expect(dossier.locator('#section-summary .atlas-delivery-sequence li').first()).toBeAttached();
  await expect(dossier.locator('#section-geography .atlas-geography-audit p').first()).not.toBeEmpty();
  await expect(dossier.locator('#section-chemistry #chemistry-material h3').first()).not.toBeEmpty();
  await expect(dossier.locator('#section-chemistry .atlas-chemical-identity h3')).not.toBeEmpty();
  await expect(dossier.locator('#section-medical-effects .atlas-evidence-sequence li p, #section-medical-effects .atlas-physiology-applicability p').first()).not.toBeEmpty();
  await expect(dossier.locator('#section-sources, .atlas-coverage, .atlas-global-summary-pills')).toHaveCount(0);
}

export async function expectNoHorizontalOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(sizes.document, 'document horizontal overflow').toBeLessThanOrEqual(sizes.viewport + 1);
  expect(sizes.body, 'body horizontal overflow').toBeLessThanOrEqual(sizes.viewport + 1);
}

export async function expectAnchorClear(page: Page, id: string) {
  await expect(page.locator(`#${id}`)).toBeFocused();
  await expect.poll(async () => page.evaluate((sectionId) => {
    const heading = document.querySelector(`#${sectionId}-heading`)!.getBoundingClientRect();
    const ribbon = document.querySelector('nav.primary')!.getBoundingClientRect();
    const nav = document.querySelector('.atlas-section-nav')!.getBoundingClientRect();
    return heading.top >= Math.max(ribbon.bottom, nav.bottom) + 4 && heading.bottom <= innerHeight;
  }, id), { message: `${id} heading clears both sticky navigation bars and is on screen` }).toBe(true);
  await expectNoHorizontalOverflow(page);
}