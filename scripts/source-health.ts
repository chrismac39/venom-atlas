import type { Citation } from '@venom-atlas/domain';
import { citationMetadataRequest } from './citation-metadata-import';

export type UrlHealthStatus = 'healthy' | 'redirect' | 'missing' | 'throttled' | 'timeout' | 'error' | 'unavailable';

export interface SourceHealthResult {
  citationId: string;
  checkedAt: string;
  stale: boolean;
  url: { status: UrlHealthStatus; httpStatus?: number | undefined; location?: string | undefined; detail?: string | undefined };
  metadata: { status: 'not_applicable' | 'current' | 'updated' | 'retracted' | 'error'; relations: string[]; detail?: string | undefined };
}

const staleAt = (accessedAt: string | undefined, now: Date, days: number): boolean => {
  if (!accessedAt) return true;
  const checked = Date.parse(accessedAt);
  return !Number.isFinite(checked) || now.getTime() - checked > days * 86_400_000;
};

const fetchWithTimeout = async (fetcher: typeof fetch, url: string, init: RequestInit, timeoutMs: number) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetcher(url, { ...init, signal: controller.signal }); }
  finally { clearTimeout(timer); }
};

export const checkSourceHealth = async (
  citation: Citation,
  fetcher: typeof fetch,
  options: { now?: Date; timeoutMs?: number; staleAfterDays?: number } = {},
): Promise<SourceHealthResult> => {
  const now = options.now ?? new Date();
  const timeoutMs = options.timeoutMs ?? 15_000;
  const result: SourceHealthResult = {
    citationId: citation.id, checkedAt: now.toISOString(), stale: staleAt(citation.accessedAt, now, options.staleAfterDays ?? 365),
    url: { status: citation.url ? 'error' : 'unavailable' },
    metadata: { status: citation.doi ? 'error' : 'not_applicable', relations: [] },
  };
  if (citation.url) {
    try {
      const response = await fetchWithTimeout(fetcher, citation.url, { method: 'HEAD', redirect: 'manual' }, timeoutMs);
      const location = response.headers.get('location') ?? undefined;
      if (response.status >= 300 && response.status < 400) result.url = { status: 'redirect', httpStatus: response.status, ...(location ? { location } : {}) };
      else if (response.status === 404 || response.status === 410) result.url = { status: 'missing', httpStatus: response.status };
      else if (response.status === 429) result.url = { status: 'throttled', httpStatus: response.status };
      else result.url = response.ok ? { status: 'healthy', httpStatus: response.status } : { status: 'error', httpStatus: response.status };
    } catch (error) {
      const timedOut = error instanceof Error && error.name === 'AbortError';
      result.url = { status: timedOut ? 'timeout' : 'error', detail: error instanceof Error ? error.message : String(error) };
    }
  }
  if (citation.doi) {
    try {
      const endpoint = citationMetadataRequest({ kind: 'doi', value: citation.doi }).endpoint;
      const response = await fetchWithTimeout(fetcher, endpoint, { headers: { Accept: 'application/json' } }, timeoutMs);
      if (!response.ok) throw new Error(`Crossref metadata request failed with HTTP ${response.status}.`);
      const payload = await response.json() as { message?: { 'update-to'?: Array<{ type?: string; DOI?: string }> } };
      const updates = payload.message?.['update-to'] ?? [];
      const relations = updates.map((entry) => [entry.type, entry.DOI].filter(Boolean).join(':')).filter(Boolean);
      result.metadata = {
        status: updates.some((entry) => entry.type?.toLowerCase().includes('retract')) ? 'retracted' : updates.length ? 'updated' : 'current',
        relations,
      };
    } catch (error) {
      result.metadata = { status: 'error', relations: [], detail: error instanceof Error ? error.message : String(error) };
    }
  }
  return result;
};