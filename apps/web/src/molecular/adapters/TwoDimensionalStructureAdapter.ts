import type {
  MoleculeRenderModel,
  MolecularRenderOptions,
  MolecularRendererAdapter,
  MolecularRendererHandle,
} from '../types';

export class TwoDimensionalStructureAdapter implements MolecularRendererAdapter {
  readonly rendererId = '2d-asset';

  supports(_model: MoleculeRenderModel): boolean {
    void _model;
    return true;
  }

  async mount(
    container: HTMLElement,
    model: MoleculeRenderModel,
    _options?: MolecularRenderOptions,
  ): Promise<MolecularRendererHandle> {
    void _options;
    const render = (): void => {
      if (!model.structureUrl) {
        container.innerHTML = '<div class="panel">2D structure asset not yet sourced.</div>';
        return;
      }
      container.innerHTML = `<img src="${model.structureUrl}" alt="2D structure of ${model.displayName}" style="max-width:100%"/>`;
    };

    render();

    return {
      update: async () => render(),
      resize: () => undefined,
      dispose: () => {
        container.innerHTML = '';
      },
    };
  }
}
