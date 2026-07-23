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
  zoomTo(): void;
  render(): void;
  clear(): void;
  resize(): void;
}

interface ThreeDmolModule {
  createViewer(container: HTMLElement, options?: Record<string, unknown>): ThreeDmolViewer;
}

const styleForRepresentation = (
  representation: MolecularRepresentation,
): Record<string, unknown> => {
  if (representation === 'ball_and_stick') {
    return { stick: { radius: 0.2 }, sphere: { scale: 0.3 } };
  }
  if (representation === 'space_filling') {
    return { sphere: { scale: 1 } };
  }
  return { stick: { radius: 0.2 } };
};

export class ThreeDmolAdapter implements MolecularRendererAdapter {
  readonly rendererId = '3dmol';

  supports(model: MoleculeRenderModel): boolean {
    return (
      model.molecularClass === 'small_molecule' &&
      !!model.structureUrl &&
      (model.structureFormat === 'sdf' ||
        model.structureFormat === 'mol' ||
        model.structureFormat === 'mol2')
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
      viewer.addModel(fileContent, nextModel.structureFormat ?? 'sdf');
      viewer.setStyle(
        {},
        styleForRepresentation(nextOptions?.representation ?? nextModel.defaultRepresentation),
      );
      viewer.zoomTo();
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
