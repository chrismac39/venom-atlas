import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThreeDmolAdapter } from '../src/molecular/adapters/ThreeDmolAdapter';
import type { MoleculeRenderModel } from '../src/molecular/types';

const mocks = vi.hoisted(() => {
  const atoms = vi.fn(() => [{ x: 0, y: 1, z: 2 }]);
  const viewer = {
    addModel: vi.fn(() => ({ selectedAtoms: atoms })), setStyle: vi.fn(),
    addSurface: vi.fn(async () => 1), removeAllSurfaces: vi.fn(), removeAllLabels: vi.fn(),
    zoomTo: vi.fn(), getView: vi.fn(() => [0, 0, 0, 10, 0, 0, 0, 1]),
    setView: vi.fn(), rotate: vi.fn(), zoom: vi.fn(), render: vi.fn(), clear: vi.fn(), resize: vi.fn(),
  };
  return { atoms, viewer, createViewer: vi.fn(() => viewer) };
});
// Exercise the optimized CommonJS default-namespace branch.
vi.mock('3dmol', () => ({ createViewer: undefined, default: { createViewer: mocks.createViewer, SurfaceType: { VDW: 1, SES: 2, SAS: 3 } } }));
const model: MoleculeRenderModel = {
  entityId: 'test', displayName: 'Test molecule', molecularClass: 'small_molecule',
  structureUrl: '/test.sdf', structureFormat: 'sdf', defaultRepresentation: 'stick',
  supportedRepresentations: ['stick'], annotations: [],
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.atoms.mockReturnValue([{ x: 0, y: 1, z: 2 }]);
  vi.stubGlobal('fetch', vi.fn(async () => new Response('structure')));
});
afterEach(() => vi.unstubAllGlobals());

describe('3Dmol lifecycle and supported semantics', () => {
  it('uses module interop, reuses coordinates for controls, resets the actual camera', async () => {
    const handle = await new ThreeDmolAdapter().mount(document.createElement('div'), model);
    await handle.update(model, { representation: 'space_filling' });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(mocks.createViewer).toHaveBeenCalledTimes(1);
    expect(mocks.viewer.addModel).toHaveBeenCalledTimes(1);
    handle.rotate?.(15, 'y'); handle.zoom?.(1.15); handle.resetView?.(); handle.resize();
    expect(mocks.viewer.rotate).toHaveBeenCalledWith(15, 'y');
    expect(mocks.viewer.zoom).toHaveBeenCalledWith(1.15);
    expect(mocks.viewer.setView).toHaveBeenCalledWith([0, 0, 0, 10, 0, 0, 0, 1]);
    handle.dispose(); handle.dispose();
    const renders = mocks.viewer.render.mock.calls.length;
    handle.resize(); handle.resetView?.(); handle.rotate?.(15, 'x'); handle.zoom?.(2);
    expect(mocks.viewer.render).toHaveBeenCalledTimes(renders);
    await expect(handle.update(model)).rejects.toThrow();
  });

  it.each([{ atoms: [] }, { atoms: [{ x: Number.NaN, y: 0, z: 0 }] }])('rejects missing or invalid atomic coordinates: %j', async ({ atoms }) => {
    mocks.atoms.mockReturnValue(atoms);
    await expect(new ThreeDmolAdapter().mount(document.createElement('div'), model)).rejects.toThrow('no usable atomic coordinates');
    expect(mocks.viewer.clear).toHaveBeenCalled();
  });

  it('rejects an HTTP failure and clears partially mounted content', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 503 })));
    const container = document.createElement('div');
    await expect(new ThreeDmolAdapter().mount(container, model)).rejects.toThrow('HTTP 503');
    expect(container.childElementCount).toBe(0);
    expect(mocks.viewer.clear).toHaveBeenCalled();
  });

  it('does not construct a viewer if cancelled during the dynamic import', async () => {
    const abort = new AbortController();
    const pending = new ThreeDmolAdapter().mount(document.createElement('div'), model, { signal: abort.signal });
    abort.abort();
    await expect(pending).rejects.toThrow();
    expect(mocks.createViewer).not.toHaveBeenCalled();
  });

  it('does not parse or render a response that arrives after cancellation', async () => {
    let respond!: (response: Response) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((resolve) => { respond = resolve; })));
    const abort = new AbortController();
    const pending = new ThreeDmolAdapter().mount(document.createElement('div'), model, { signal: abort.signal });
    await vi.waitFor(() => expect(fetch).toHaveBeenCalled());
    abort.abort();
    respond(new Response('late response'));
    await expect(pending).rejects.toThrow();
    expect(mocks.viewer.addModel).not.toHaveBeenCalled();
    expect(mocks.viewer.render).not.toHaveBeenCalled();
  });

  it.each(['gaussian', 'hydrophobicity', 'electrostatic'] as const)('refuses placeholder %s surfaces', async (unsupported) => {
    await expect(new ThreeDmolAdapter().mount(document.createElement('div'), model, {
      surface: { enabled: true, kind: unsupported === 'gaussian' ? 'gaussian' : 'ses', colorMode: unsupported === 'gaussian' ? 'element' : unsupported, opacity: 0.5 },
    })).rejects.toThrow('not implemented');
    expect(mocks.viewer.addSurface).not.toHaveBeenCalled();
  });

  it.each(['ses', 'sas', 'vdw'] as const)('uses the actual %s geometric surface constant', async (kind) => {
    const handle = await new ThreeDmolAdapter().mount(document.createElement('div'), model, {
      surface: { enabled: true, kind, colorMode: 'uniform', opacity: 0.5, uniformColor: '#123456' },
    });
    expect(mocks.viewer.addSurface).toHaveBeenCalledWith({ ses: 2, sas: 3, vdw: 1 }[kind], { opacity: 0.5, color: '#123456' }, {});
    handle.dispose();
  });
});