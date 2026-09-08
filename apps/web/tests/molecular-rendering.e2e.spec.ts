import { expect, test, type Locator, type Page } from '@playwright/test';
import { PNG } from 'pngjs';

const fireAnt = '/renderer/solenopsin-a#section-chemistry';
const frog = '/renderer/batrachotoxin#section-chemistry';
const viewer = (page: Page) => page.getByRole('region', { name: 'Molecular viewer', exact: true });
const canvas = (page: Page) => viewer(page).locator('canvas');
const host = (page: Page) => viewer(page).getByRole('group', { name: /interactive molecular structure/ });
// The library exposes its viewer on the canvas. Inspect camera state separately
// from screenshots, whose subpixel clipping changes when the page scrolls.
const camera = (page: Page) => canvas(page).evaluate((el) =>
  (el as HTMLCanvasElement & { _3dmol_viewer: { getView(): number[] } })._3dmol_viewer.getView());
const visit = async (page: Page, path = fireAnt) => {
  await page.goto(path);
  // Hydration's deep-link scroll and late image sizing can move this deferred
  // island after the first scroll. Keep approaching it until it has mounted.
  await expect(async () => {
    await page.locator('.chemistry-render-grid').evaluate((el) => el.scrollIntoView({ behavior: 'instant', block: 'center' }));
    await expect(viewer(page)).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 20_000 });
};
const visiblePixels = (image: Buffer) => {
  const { data } = PNG.sync.read(image);
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    // The dark background is RGB 23/24/24; molecular atoms/bonds are brighter.
    if (Math.max(data[i]!, data[i + 1]!, data[i + 2]!) > 85 && data[i + 3]! > 0) count++;
  }
  return count;
};
const assertMolecule = async (page: Page) => {
  await expect(viewer(page)).toHaveAttribute('data-state', 'ready');
  await expect(canvas(page)).toHaveCount(1);
  await expect.poll(async () => visiblePixels(await canvas(page).screenshot())).toBeGreaterThan(200);
};
const pixelsChanged = async (element: Locator, before: Buffer) => {
  await expect.poll(async () => !(await element.screenshot()).equals(before)).toBe(true);
};
const assertFallback = async (page: Page) => {
  await expect(viewer(page)).toHaveAttribute('data-state', 'error');
  await expect(viewer(page).getByRole('alert')).toContainText('Unable to render');
  const image = viewer(page).getByRole('img', { name: /2D skeletal/ });
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(page.getByText('Molecular class:', { exact: true })).toBeVisible();
  await expect(viewer(page).getByRole('button', { name: 'Retry 3D viewer' })).toBeEnabled();
};

test('cold load, reload, and return from another organism render actual molecule pixels', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await visit(page); await assertMolecule(page);
  await page.reload();
  await page.locator('.chemistry-render-grid').scrollIntoViewIfNeeded();
  await assertMolecule(page);
  await page.locator('#section-geography').scrollIntoViewIfNeeded();
  await page.locator('.chemistry-render-grid').scrollIntoViewIfNeeded();
  await assertMolecule(page);
  await visit(page, frog); await assertMolecule(page);
  await visit(page); await assertMolecule(page);
  expect(errors).toEqual([]);
});

test('drag, keyboard rotation, camera reset, resize and supported representations change visible pixels', async ({ page }) => {
  let structureRequests = 0;
  page.on('request', (request) => { if (request.url().includes('/structures/solenopsin-a.sdf')) structureRequests++; });
  await visit(page); await assertMolecule(page);
  await host(page).scrollIntoViewIfNeeded();
  const initial = await canvas(page).screenshot();
  const initialScroll = await page.evaluate(() => window.scrollY);
  const initialCamera = await camera(page);
  const bounds = (await canvas(page).boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width / 2 + 75, bounds.y + bounds.height / 2 + 40, { steps: 8 });
  await page.mouse.up();
  await pixelsChanged(canvas(page), initial);
  await viewer(page).getByRole('button', { name: 'Reset view' }).click();
  await expect.poll(() => camera(page)).toEqual(initialCamera);
  // Clicking the reset control may scroll it into view. Compare pixels at the
  // same viewport position so canvas clipping does not masquerade as rotation.
  await page.evaluate((scrollY) => window.scrollTo({ top: scrollY, behavior: 'instant' }), initialScroll);
  await expect.poll(async () => (await canvas(page).screenshot()).equals(initial)).toBe(true);
  // Tab into the viewer from the preceding disclosure; the host is keyboard reachable.
  await viewer(page).locator('summary').focus();
  await page.keyboard.press('Tab');
  await expect(host(page)).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await pixelsChanged(canvas(page), initial);
  await page.keyboard.press('Home');
  await expect.poll(() => camera(page)).toEqual(initialCamera);
  await page.evaluate((scrollY) => window.scrollTo({ top: scrollY, behavior: 'instant' }), initialScroll);
  await expect.poll(async () => (await canvas(page).screenshot()).equals(initial)).toBe(true);
  await page.keyboard.press('+');
  await pixelsChanged(canvas(page), initial);
  await page.keyboard.press('Tab');
  await expect(host(page)).not.toBeFocused();

  for (const representation of ['stick', 'space_filling', 'molecular_surface']) {
    await viewer(page).getByLabel('Representation', { exact: true }).selectOption(representation);
    await assertMolecule(page);
  }
  await viewer(page).getByText('Advanced display controls', { exact: true }).click();
  for (const surface of ['sas', 'vdw', 'ses']) {
    await viewer(page).getByLabel('Surface type', { exact: true }).selectOption(surface);
    await assertMolecule(page);
  }
  await expect(viewer(page).locator('option[value="gaussian"], option[value="electrostatic"], option[value="hydrophobicity"], option[value="electrostatic_surface"], option[value="two_dimensional_skeletal"]')).toHaveCount(0);
  expect(structureRequests).toBe(1);
  const oldWidth = await canvas(page).evaluate((el: HTMLCanvasElement) => el.width);
  await page.setViewportSize({ width: 390, height: 844 });
  await assertMolecule(page);
  await expect.poll(() => canvas(page).evaluate((el: HTMLCanvasElement) => el.width)).toBeLessThan(oldWidth);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('unfocused wheel scrolls the page, focused wheel zooms, Escape restores page scrolling', async ({ page }) => {
  await visit(page); await assertMolecule(page);
  await host(page).scrollIntoViewIfNeeded();
  await host(page).hover();
  const before = await page.evaluate(() => window.scrollY);
  const initialCamera = await camera(page);
  const image = await canvas(page).screenshot();
  await page.mouse.wheel(0, 180);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before);
  expect(await camera(page)).toEqual(initialCamera);
  await host(page).focus();
  await host(page).hover();
  const focusedY = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 180);
  await pixelsChanged(canvas(page), image);
  expect(await page.evaluate(() => window.scrollY)).toBe(focusedY);
  await page.keyboard.press('Escape');
  await expect(host(page)).not.toBeFocused();
  await page.mouse.wheel(0, 180);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(focusedY);
});

test('failed dynamic renderer import leaves readable text and 2D', async ({ page }) => {
  let blocked = 0;
  await page.route(/\/(?:3dmol)[^/]*\.js(?:\?|$)/i, (route) => { blocked++; return route.abort('failed'); });
  await visit(page); await assertFallback(page);
  expect(blocked).toBeGreaterThan(0);
});

test('failed structure request has a recoverable retry and 2D fallback', async ({ page }) => {
  await page.route('**/structures/solenopsin-a.sdf', (route) => route.fulfill({ status: 503, body: 'Unavailable' }));
  await visit(page); await assertFallback(page);
  await page.unroute('**/structures/solenopsin-a.sdf');
  await viewer(page).getByRole('button', { name: 'Retry 3D viewer' }).click();
  await assertMolecule(page);
});

test('malformed structure cannot pass as a blank but successful canvas', async ({ page }) => {
  await page.route('**/structures/solenopsin-a.sdf', (route) => route.fulfill({ contentType: 'text/plain', body: 'not a molecular structure' }));
  await visit(page); await assertFallback(page);
  await expect(viewer(page).getByRole('alert')).toContainText('no usable atomic coordinates');
});

test('unavailable WebGL keeps chemistry and 2D usable', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type.toLowerCase().includes('webgl')) return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
    // 3Dmol 2.5.5 shares an OffscreenCanvas WebGL2 context when supported.
    if (typeof OffscreenCanvas !== 'undefined') {
      const offscreen = OffscreenCanvas.prototype.getContext;
      OffscreenCanvas.prototype.getContext = function (this: OffscreenCanvas, type: string, ...args: unknown[]) {
        if (type.toLowerCase().includes('webgl')) return null;
        return Reflect.apply(offscreen, this, [type, ...args]);
      } as typeof offscreen;
    }
  });
  await visit(page); await assertFallback(page);
});

test('fictional complex contacts are not part of the normal chemistry narrative', async ({ page }) => {
  const demoRequests: string[] = [];
  page.on('request', (request) => { if (/membrane-demo|complex-demo/.test(request.url())) demoRequests.push(request.url()); });
  await visit(page); await assertMolecule(page);
  await expect(page.getByRole('region', { name: 'Target interaction viewer' })).toHaveCount(0);
  await expect(page.getByText(/ARG12|GLU818|LYS13|ASP821/)).toHaveCount(0);
  expect(demoRequests).toEqual([]);
});

test('dedicated structure fixture also renders and retains its static 2D formula', async ({ page }) => {
  await page.goto('/renderer/batrachotoxin');
  await viewer(page).scrollIntoViewIfNeeded();
  await assertMolecule(page);
  const image = page.getByRole('img', { name: '2D skeletal structure for Batrachotoxin' });
  await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
});

test('both 2D assets keep all stereochemical text inside the visible viewport', async ({ page }) => {
  for (const slug of ['solenopsin-a', 'batrachotoxin']) {
    await page.goto(`/images/${slug}-2d.svg`);
    const result = await page.locator('svg').evaluate((element: SVGSVGElement) => {
      const view = element.viewBox.baseVal;
      const labels = [...element.querySelectorAll('text')];
      return {
        hasEnantiomerLabel: labels.some((label) => label.textContent === 'this enantiomer'),
        clipped: labels.filter((label) => {
          const box = label.getBBox();
          return box.x < view.x || box.y < view.y || box.x + box.width > view.x + view.width || box.y + box.height > view.y + view.height;
        }).map((label) => label.textContent),
      };
    });
    expect(result.hasEnantiomerLabel).toBe(true);
    expect(result.clipped).toEqual([]);
  }
});