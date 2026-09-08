// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import type { Citation } from '@venom-atlas/domain';
import { checkSourceHealth } from '../../../scripts/source-health';

const citation = (overrides: Partial<Citation> = {}): Citation => ({
  id: 'cit-test', slug: 'test', title: 'Test', authors: [], sourceType: 'journal_article', visibility: 'public',
  url: 'https://example.test/article', doi: '10.1000/test', accessedAt: '2024-01-01', ...overrides,
});

describe('source health maintenance', () => {
  it('distinguishes redirects and Crossref retractions', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 301, headers: { location: 'https://example.test/current' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: { 'update-to': [{ type: 'retraction', DOI: '10.1000/retraction' }] } }), { status: 200 }));
    const result = await checkSourceHealth(citation(), fetcher as typeof fetch, { now: new Date('2026-01-02T00:00:00Z') });
    expect(result).toEqual(expect.objectContaining({
      stale: true, url: expect.objectContaining({ status: 'redirect', httpStatus: 301 }),
      metadata: expect.objectContaining({ status: 'retracted', relations: ['retraction:10.1000/retraction'] }),
    }));
  });

  it.each([[404, 'missing'], [429, 'throttled'], [500, 'error']] as const)('maps HTTP %s to %s', async (status, expected) => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status }));
    const result = await checkSourceHealth(citation({ doi: undefined }), fetcher as typeof fetch);
    expect(result.url.status).toBe(expected);
  });
});