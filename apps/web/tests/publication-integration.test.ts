// @vitest-environment node
import { EventEmitter } from 'node:events';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { publicationIntegration } from '../../../scripts/astro-publication.mjs';

const mocks = vi.hoisted(() => ({ execute: vi.fn(), remove: vi.fn() }));
vi.mock('node:child_process', () => ({ execFileSync: mocks.execute }));
vi.mock('node:fs', () => ({ rmSync: mocks.remove }));
const repo = fileURLToPath(new URL('../../../', import.meta.url));

beforeEach(() => { vi.clearAllMocks(); mocks.execute.mockReset(); vi.useFakeTimers(); });
afterEach(() => vi.useRealTimers());

describe('Astro publication integration', () => {
  it('regenerates before dev serves', () => {
    publicationIntegration().hooks['astro:config:setup']({ command: 'dev', config: {} });
    expect(mocks.execute).toHaveBeenCalledOnce();
  });

  it('removes old build output before regeneration and refuses a failed gate', () => {
    mocks.execute.mockImplementation(() => { throw new Error('gate failed'); });
    const outDir = new URL('./apps/web/dist/', `file:///${repo.replace(/\\/g, '/')}`);
    expect(() => publicationIntegration().hooks['astro:config:setup']({ command: 'build', config: { outDir } })).toThrow('gate failed');
    expect(mocks.remove).toHaveBeenCalledWith(outDir, { recursive: true, force: true });
  });

  it('validates preview against fresh data rather than trusting an old dist', () => {
    publicationIntegration().hooks['astro:config:setup']({ command: 'preview', config: {} });
    expect(mocks.execute.mock.calls.map((call) => call[1][2])).toEqual([
      path.join(repo, 'scripts/prepare-publication.ts'),
      path.join(repo, 'scripts/validate-built-routes.ts'),
      path.join(repo, 'scripts/validate-publication-output.ts'),
    ]);
  });

  it('fails closed during source edits and on rebuild failure; successful retry invalidates SSR', () => {
    const watcher = Object.assign(new EventEmitter(), { add: vi.fn() });
    const httpServer = new EventEmitter();
    const middleware = vi.fn();
    const invalidateAll = vi.fn();
    const send = vi.fn();
    const logger = { error: vi.fn() };
    publicationIntegration().hooks['astro:server:setup']({
      server: { watcher, httpServer, middlewares: { use: middleware }, moduleGraph: { invalidateAll }, ws: { send } }, logger,
    });
    const response = { statusCode: 200, end: vi.fn() };
    const next = vi.fn();
    const handle = middleware.mock.calls[0]![0];
    handle({}, response, next);
    expect(next).toHaveBeenCalledOnce();
    next.mockClear();

    watcher.emit('all', 'change', path.join(repo, 'content-source/organisms/draft.yaml'));
    handle({}, response, next);
    expect(response.statusCode).toBe(503);
    expect(next).not.toHaveBeenCalled();
    mocks.execute.mockImplementationOnce(() => { throw new Error('invalid content'); });
    vi.runAllTimers();
    expect(logger.error).toHaveBeenCalled();
    handle({}, response, next);
    expect(next).not.toHaveBeenCalled();

    watcher.emit('all', 'change', path.join(repo, 'content-source/organisms/draft.yaml'));
    vi.runAllTimers();
    handle({}, response, next);
    expect(next).toHaveBeenCalledOnce();
    expect(invalidateAll).toHaveBeenCalledOnce();
    expect(send).toHaveBeenCalledWith({ type: 'full-reload' });
    mocks.execute.mockClear();
    watcher.emit('all', 'change', path.join(repo, 'apps/web/public/data/search-index.json'));
    vi.runAllTimers();
    expect(mocks.execute).not.toHaveBeenCalled();
    httpServer.emit('close');
    expect(watcher.listenerCount('all')).toBe(0);
  });
});