import type {
  MoleculeRenderModel,
  MolecularRenderOptions,
  MolecularRepresentation,
  MolecularRendererAdapter,
  MolecularRendererHandle,
} from '../types';

interface ThreeDmolViewer {
  addModel(data: string, format: string): { selectedAtoms(selection: object): Array<{ x: number; y: number; z: number }> };
  getView(): number[];
  setView(view: number[]): void;
  rotate(angle: number, axis: 'x' | 'y'): void;
  zoom(factor: number): void;
  removeAllSurfaces(): void;
  removeAllLabels(): void;
  setStyle(_selection: unknown, style: Record<string, unknown>): void;
  addSurface(
    type: unknown,
    style: Record<string, unknown>,
    selection?: Record<string, unknown>,
  ): unknown;
  zoomTo(selection?: Record<string, unknown>): void;
  render(): void;
  clear(): void;
  resize(): void;
}

interface ThreeDmolModule {
  createViewer(container: HTMLElement, options?: Record<string, unknown>): ThreeDmolViewer;
  SurfaceType?: {
    VDW?: unknown;
    SES?: unknown;
    SAS?: unknown;
  };
}

const styleForRepresentation = (
  representation: MolecularRepresentation,
): Record<string, unknown> => {
  if (representation === 'cartoon' || representation === 'ribbon') {
    return { cartoon: { color: 'spectrum' } };
  }
  if (representation === 'target_complex') {
    return { stick: { radius: 0.18 } };
  }
  if (representation === 'ball_and_stick') {
    return { stick: { radius: 0.2 }, sphere: { scale: 0.3 } };
  }
  if (representation === 'space_filling') {
    return { sphere: { scale: 1 } };
  }
  return { stick: { radius: 0.2 } };
};

const normalizeStructureFormat = (format: MoleculeRenderModel['structureFormat']): string => {
  if (format === 'mmcif') {
    return 'mmcif';
  }
  return format ?? 'sdf';
};

const surfaceTypeForKind = (
  module: ThreeDmolModule,
  kind: 'ses' | 'sas' | 'vdw' | 'gaussian',
): unknown => {
  if (kind === 'gaussian') {
    throw new Error('Gaussian surfaces are not implemented.');
  }
  const value = module.SurfaceType?.[kind === 'ses' ? 'SES' : kind === 'sas' ? 'SAS' : 'VDW'];
  if (value === undefined) throw new Error(`The ${kind.toUpperCase()} surface is unavailable.`);
  return value;
};

const buildSurfaceStyle = (
  options: MolecularRenderOptions,
): Record<string, unknown> => {
  const surface = options.surface;
  if (!surface || !surface.enabled) {
    return {};
  }

  if (surface.colorMode === 'uniform') {
    return {
      opacity: surface.opacity,
      color: surface.uniformColor ?? '#5da9ff',
    };
  }

  if (surface.colorMode === 'electrostatic' || surface.colorMode === 'hydrophobicity') {
    throw new Error('Electrostatic and hydrophobicity analyses are not implemented.');
  }

  return {
    opacity: surface.opacity,
    colorscheme: 'Jmol',
  };
};

const parseResidueSelection = (residue: {
  chain: string;
  residueNumber: number;
}): Record<string, unknown> => ({
  chain: residue.chain,
  resi: residue.residueNumber,
});

const applyInteractionStyles = (
  viewer: ThreeDmolViewer,
  options: MolecularRenderOptions,
): void => {
  const interactionView = options.interactionView;
  const annotation = interactionView?.annotation;
  if (!annotation) {
    return;
  }

  for (const chain of annotation.target.chains) {
    viewer.setStyle({ chain }, { cartoon: { color: '#5b8db8', opacity: 0.6 } });
  }

  for (const chain of annotation.venomComponent.chains) {
    viewer.setStyle({ chain }, { stick: { color: '#e48f2a', radius: 0.24 } });
  }

  for (const ion of annotation.ions ?? []) {
    viewer.setStyle(
      {
        ...(ion.chain ? { chain: ion.chain } : {}),
        ...(ion.residueNumber ? { resi: ion.residueNumber } : {}),
      },
      { sphere: { color: '#e4d14f', radius: 0.7 } },
    );
  }

  if (interactionView?.showContactHighlights) {
    for (const interaction of annotation.interactions) {
      viewer.setStyle(parseResidueSelection(interaction.toxinResidue), {
        stick: { color: '#f0b66a', radius: 0.28 },
      });
      viewer.setStyle(parseResidueSelection(interaction.targetResidue), {
        stick: { color: '#7dd3fc', radius: 0.28 },
      });

    }
  }

  const selectedPreset = annotation.cameraPresets.find(
    (preset) => preset.id === interactionView?.selectedPresetId,
  );
  if (selectedPreset?.selection) {
    viewer.zoomTo(selectedPreset.selection);
    return;
  }

  viewer.zoomTo();
};

export class ThreeDmolAdapter implements MolecularRendererAdapter {
  readonly rendererId = '3dmol';

  supports(model: MoleculeRenderModel): boolean {
    if (model.molecularClass === 'complex') {
      return !!model.structureUrl && (model.structureFormat === 'pdb' || model.structureFormat === 'mmcif');
    }

    return (
      model.molecularClass === 'small_molecule' &&
      !!model.structureUrl &&
      (model.structureFormat === 'sdf' ||
        model.structureFormat === 'mol' ||
        model.structureFormat === 'mol2' ||
        model.structureFormat === 'pdb' ||
        model.structureFormat === 'mmcif')
    );
  }

  async mount(
    container: HTMLElement,
    model: MoleculeRenderModel,
    options?: MolecularRenderOptions,
  ): Promise<MolecularRendererHandle> {
    const imported = await import('3dmol');
    options?.signal?.throwIfAborted();
    // Vite's optimized CommonJS namespace and Rollup's production namespace differ.
    const namespace = imported as unknown as ThreeDmolModule & { default?: ThreeDmolModule };
    const module = typeof namespace.createViewer === 'function' ? namespace : namespace.default;
    if (!module || typeof module.createViewer !== 'function') {
      throw new Error('The molecular renderer module could not be initialized.');
    }
    const abort = new AbortController();
    let disposed = false;
    let loadedSource = '';
    let initialView: number[] | undefined;
    const viewer = module.createViewer(container, {
      backgroundColor: options?.backgroundColor ?? '#171818',
    });
    const dispose = () => {
      if (disposed) return;
      disposed = true;
      abort.abort();
      options?.signal?.removeEventListener('abort', dispose);
      viewer.clear();
      container.replaceChildren();
    };
    options?.signal?.addEventListener('abort', dispose, { once: true });

    const applyModel = async (
      nextModel: MoleculeRenderModel,
      nextOptions?: MolecularRenderOptions,
    ): Promise<void> => {
      abort.signal.throwIfAborted();
      if (!nextModel.structureUrl) {
        throw new Error('No structure file URL is available for this molecule.');
      }
      const mergedOptions = {
        ...(options ?? {}),
        ...(nextOptions ?? {}),
      } as MolecularRenderOptions;
      const representation = mergedOptions.representation ?? nextModel.defaultRepresentation;
      if (representation === 'electrostatic_surface' || representation === 'two_dimensional_skeletal' || representation === 'amino_acid_sequence') {
        throw new Error('This representation is not supported by the 3D renderer.');
      }
      const source = `${nextModel.structureFormat}:${nextModel.structureUrl}`;
      const sourceChanged = source !== loadedSource;
      if (sourceChanged) {
        const response = await fetch(nextModel.structureUrl, { signal: abort.signal });
        if (!response.ok) throw new Error(`Structure request failed (HTTP ${response.status}).`);
        const fileContent = await response.text();
        abort.signal.throwIfAborted();
        viewer.clear();
        const parsed = viewer.addModel(fileContent, normalizeStructureFormat(nextModel.structureFormat));
        const atoms = parsed.selectedAtoms({});
        if (!atoms.length || atoms.some((atom) => ![atom.x, atom.y, atom.z].every(Number.isFinite))) {
          throw new Error('The structure file contains no usable atomic coordinates.');
        }
        loadedSource = source;
      }
      viewer.removeAllSurfaces();
      viewer.removeAllLabels();
      viewer.setStyle({}, styleForRepresentation(representation));

      if (mergedOptions.surface?.enabled) {
        const surfaceStyle = buildSurfaceStyle(mergedOptions);
        const kind = mergedOptions.surface.kind;
        await viewer.addSurface(surfaceTypeForKind(module, kind), surfaceStyle, {});
        abort.signal.throwIfAborted();
      }

      applyInteractionStyles(viewer, mergedOptions);

      if (sourceChanged && !mergedOptions.interactionView?.annotation) {
        viewer.zoomTo();
      }
      if (sourceChanged) initialView = [...viewer.getView()];
      viewer.render();
    };

    try {
      await applyModel(model, options);
    } catch (error) {
      dispose();
      throw error;
    }

    return {
      update: async (nextModel, nextOptions) => {
        await applyModel(nextModel, nextOptions);
      },
      resize: () => {
        if (disposed) return;
        viewer.resize();
        viewer.render();
      },
      resetView: () => {
        if (disposed) return;
        if (initialView) viewer.setView([...initialView]);
        viewer.render();
      },
      rotate: (angle, axis) => { if (!disposed) { viewer.rotate(angle, axis); viewer.render(); } },
      zoom: (factor) => { if (!disposed) { viewer.zoom(factor); viewer.render(); } },
      dispose,
    };
  }
}
