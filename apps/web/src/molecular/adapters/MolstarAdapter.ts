import type {
  MoleculeRenderModel,
  MolecularRenderOptions,
  MolecularRendererAdapter,
  MolecularRendererHandle,
} from '../types';

export interface MolstarFutureConfig {
  plannedSupport: {
    peptideToxins: boolean;
    proteinToxins: boolean;
    receptorStructures: boolean;
    toxinTargetComplexes: boolean;
    ribbonCartoonSurfaceModes: boolean;
  };
}

export const molstarFutureConfig: MolstarFutureConfig = {
  plannedSupport: {
    peptideToxins: true,
    proteinToxins: true,
    receptorStructures: true,
    toxinTargetComplexes: true,
    ribbonCartoonSurfaceModes: true,
  },
};

export class MolstarAdapter implements MolecularRendererAdapter {
  readonly rendererId = 'molstar-boundary';

  supports(model: MoleculeRenderModel): boolean {
    return (
      model.molecularClass === 'protein' ||
      model.molecularClass === 'peptide' ||
      model.molecularClass === 'complex'
    );
  }

  async mount(
    container: HTMLElement,
    _model: MoleculeRenderModel,
    _options?: MolecularRenderOptions,
  ): Promise<MolecularRendererHandle> {
    void _model;
    void _options;
    container.innerHTML =
      '<div class="panel"><strong>Mol* adapter boundary</strong><p class="muted">Renderer is intentionally scaffolded. This sample has no sourced peptide/protein/complex structure yet.</p></div>';

    return {
      update: async () => Promise.resolve(),
      resize: () => undefined,
      dispose: () => {
        container.innerHTML = '';
      },
    };
  }
}
