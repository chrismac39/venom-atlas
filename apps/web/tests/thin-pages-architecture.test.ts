import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const featuresRoot = join(process.cwd(), 'src', 'features');

const collectPageFiles = (dir: string): string[] => {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      files.push(...collectPageFiles(fullPath));
      continue;
    }

    if (entry.endsWith('Page.tsx')) {
      files.push(fullPath);
    }
  }

  return files;
};

describe('thin page architecture', () => {
  it('keeps route pages orchestration-free', () => {
    const pageFiles = collectPageFiles(featuresRoot);
    const disallowedPatterns = [
      /\buseEffect\s*\(/,
      /\buseState\s*\(/,
      /\buseMemo\s*\(/,
      /\buseReducer\s*\(/,
      /\buseRef\s*\(/,
      /\batlasApi\./,
    ];

    const violations: string[] = [];

    for (const pageFile of pageFiles) {
      const content = readFileSync(pageFile, 'utf8');
      const relativePath = pageFile.replace(process.cwd() + '\\', '').replace(/\\/g, '/');

      const hasViolation = disallowedPatterns.some((pattern) => pattern.test(content));
      if (hasViolation) {
        violations.push(relativePath);
      }
    }

    expect(violations, `Thin-page violations found in: ${violations.join(', ')}`).toEqual([]);
  });
});
