import type {
  MoleculeRenderModel,
  MolecularRenderOptions,
  MolecularRepresentation,
  MolecularRendererAdapter,
  MolecularRendererHandle,
} from '../types';

interface ThreeDmolViewer {
  addModel(data: string, format: string): void;
  setStyle(_selection: unknown, style: Record<string, unknown>): void;
  addSurface(
    type: unknown,
    style: Record<string, unknown>,
    selection?: Record<string, unknown>,
  ): unknown;
  addLabel?(text: string, options: Record<string, unknown>): unknown;
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
  Gradient?: {
    RWB?: new (min: number, max: number) => unknown;
  };
  VolumeData?: new (data: string, format: 'dx' | 'cube') => unknown;
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
  if (kind === 'ses') {
    return module.SurfaceType?.SES ?? module.SurfaceType?.VDW ?? 1;
  }
  if (kind === 'sas') {
    return module.SurfaceType?.SAS ?? module.SurfaceType?.VDW ?? 3;
  }
  if (kind === 'gaussian') {
    return module.SurfaceType?.VDW ?? 1;
  }
  return module.SurfaceType?.VDW ?? 1;
};

const buildSurfaceStyle = (
  module: ThreeDmolModule,
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

  if (surface.colorMode === 'electrostatic') {
    const potentialSpec = options.interactionView?.annotation?.electrostaticPotential;
    if (!potentialSpec || !module.VolumeData || !module.Gradient?.RWB) {
      return {
        opacity: surface.opacity,
        color: '#5da9ff',
      };
    }

    return {
      opacity: surface.opacity,
      colorscheme: new module.Gradient.RWB(-10, 10),
      potentialSpec,
    };
  }

  if (surface.colorMode === 'hydrophobicity') {
    return {
      opacity: surface.opacity,
      color: '#7ea06a',
    };
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

      if (interactionView.showResidueLabels && viewer.addLabel) {
        const distanceText = interaction.distanceAngstroms
          ? ` (${interaction.distanceAngstroms.toFixed(1)} A)`
          : '';
        viewer.addLabel(`${interaction.type}${distanceText}`, {
          alignment: 'center',
          fontSize: 10,
          backgroundOpacity: 0.35,
          position: {
            x: 0,
            y: 0,
            z: 0,
          },
        });
      }
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
    const module = (await import('3dmol')) as unknown as ThreeDmolModule;
    const viewer = module.createViewer(container, {
      backgroundColor: options?.backgroundColor ?? '#171818',
    });

    const applyModel = async (
      nextModel: MoleculeRenderModel,
      nextOptions?: MolecularRenderOptions,
    ): Promise<void> => {
      viewer.clear();
      if (!nextModel.structureUrl) {
        throw new Error('No structure file URL is available for this molecule.');
      }
      const response = await fetch(nextModel.structureUrl);
      if (!response.ok) {
        throw new Error(`Unable to load structure file: ${nextModel.structureUrl}`);
      }
      const fileContent = await response.text();
      const mergedOptions = {
        ...(options ?? {}),
        ...(nextOptions ?? {}),
      } as MolecularRenderOptions;

      viewer.addModel(fileContent, normalizeStructureFormat(nextModel.structureFormat));
      const representation = mergedOptions.representation ?? nextModel.defaultRepresentation;
      viewer.setStyle({}, styleForRepresentation(representation));

      if (mergedOptions.surface?.enabled) {
        const surfaceStyle = buildSurfaceStyle(module, mergedOptions);
        const kind = mergedOptions.surface.kind;
        viewer.addSurface(surfaceTypeForKind(module, kind), surfaceStyle, {});
      }

      applyInteractionStyles(viewer, mergedOptions);

      if (!mergedOptions.interactionView?.annotation) {
        viewer.zoomTo();
      }

      viewer.render();
    };

    await applyModel(model, options);

    return {
      update: async (nextModel, nextOptions) => {
        await applyModel(nextModel, nextOptions);
      },
      resize: () => {
        viewer.resize();
        viewer.render();
      },
      dispose: () => {
        viewer.clear();
      },
    };
  }
}
