import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MoleculeViewer } from '../src/molecular/components/MoleculeViewer';
import type { MoleculeRenderModel, MolecularRendererHandle } from '../src/molecular/types';

const { mount } = vi.hoisted(() => ({ mount: vi.fn() }));
vi.mock('../src/molecular/adapters/selectRenderer', () => ({ pickMolecularRenderer: () => ({ rendererId: '3dmol', mount }) }));
const model: MoleculeRenderModel = {
  entityId: 'test', displayName: 'Test molecule', molecularClass: 'small_molecule',
  structureUrl: '/test.sdf', structure2dUrl: '/test.svg', structureFormat: 'sdf', defaultRepresentation: 'stick',
  supportedRepresentations: ['stick', 'space_filling', 'molecular_surface', 'electrostatic_surface', 'two_dimensional_skeletal'], annotations: [],
};
const handle = (): MolecularRendererHandle => ({ update: vi.fn(async () => {}), resize: vi.fn(), dispose: vi.fn(), resetView: vi.fn(), rotate: vi.fn(), zoom: vi.fn() });
beforeEach(() => mount.mockReset());
afterEach(cleanup);

describe('molecular viewer lifecycle', () => {
  it('updates controls without remounting, supports keyboard/reset, disposes on unmount', async () => {
    const renderer = handle(); mount.mockResolvedValue(renderer);
    const view = render(<MoleculeViewer model={model} />);
    await waitFor(() => expect(screen.getByRole('region').getAttribute('data-state')).toBe('ready'));
    fireEvent.change(screen.getByLabelText('Representation'), { target: { value: 'space_filling' } });
    await waitFor(() => expect(renderer.update).toHaveBeenCalled());
    expect(mount).toHaveBeenCalledTimes(1);
    const host = screen.getByRole('group', { name: /interactive molecular/ });
    fireEvent.keyDown(host, { key: 'ArrowLeft' });
    fireEvent.keyDown(host, { key: '+' });
    fireEvent.click(screen.getByText('Reset view'));
    expect(renderer.rotate).toHaveBeenCalledWith(-15, 'y');
    expect(renderer.zoom).toHaveBeenCalledWith(1.15);
    expect(renderer.resetView).toHaveBeenCalled();
    view.unmount();
    expect(renderer.dispose).toHaveBeenCalled();
    expect(mount.mock.calls[0]?.[2].signal.aborted).toBe(true);
  });

  it('keeps the host mounted and retries a failed load with a readable 2D fallback', async () => {
    mount.mockRejectedValueOnce(new Error('Structure unavailable')).mockResolvedValueOnce(handle());
    render(<MoleculeViewer model={model} />);
    await screen.findByRole('alert');
    expect(screen.getByAltText('2D skeletal structure for Test molecule').getAttribute('src')).toBe('/test.svg');
    fireEvent.click(screen.getByText('Retry 3D viewer'));
    await waitFor(() => expect(screen.getByRole('region').getAttribute('data-state')).toBe('ready'));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(mount).toHaveBeenCalledTimes(2);
  });

  it('disposes a late mount without replacing the next model handle', async () => {
    let resolve!: (value: MolecularRendererHandle) => void;
    const oldHandle = handle(); const newHandle = handle();
    mount.mockImplementationOnce(() => new Promise((done) => { resolve = done; })).mockResolvedValueOnce(newHandle);
    const view = render(<MoleculeViewer model={model} />);
    view.rerender(<MoleculeViewer model={{ ...model, entityId: 'new' }} />);
    await waitFor(() => expect(screen.getByRole('region').getAttribute('data-state')).toBe('ready'));
    await act(async () => resolve(oldHandle));
    expect(oldHandle.dispose).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Reset view'));
    expect(newHandle.resetView).toHaveBeenCalled();
  });

  it('never offers placeholder representations or analysis options', async () => {
    mount.mockResolvedValue(handle()); render(<MoleculeViewer model={model} />);
    await waitFor(() => expect(screen.getByRole('region').getAttribute('data-state')).toBe('ready'));
    expect(screen.queryByRole('option', { name: 'electrostatic_surface' })).toBeNull();
    expect(screen.queryByRole('option', { name: 'two_dimensional_skeletal' })).toBeNull();
    fireEvent.change(screen.getByLabelText('Representation'), { target: { value: 'molecular_surface' } });
    fireEvent.click(screen.getByText('Advanced display controls'));
    expect(screen.queryByRole('option', { name: /Gaussian|Hydrophobicity|Electrostatic/ })).toBeNull();
  });
});