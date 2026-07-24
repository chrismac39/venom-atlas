import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('static-first architecture', () => {
  it('does not use runtime SPA router bootstrap in active web src', () => {
    const sourceRoot = join(process.cwd(), 'src');
    const content = readFileSync(join(sourceRoot, 'pages', 'index.astro'), 'utf8');
    expect(content.includes('createBrowserRouter')).toBe(false);
  });

  it('keeps API base url env out of active page rendering entry', () => {
    const content = readFileSync(join(process.cwd(), 'src', 'lib', 'content.ts'), 'utf8');
    expect(content.includes('VITE_API_BASE_URL')).toBe(false);
  });
});
