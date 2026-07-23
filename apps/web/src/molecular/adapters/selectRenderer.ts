import type { MoleculeRenderModel, MolecularRendererAdapter } from '../types';
import { MolstarAdapter } from './MolstarAdapter';
import { ThreeDmolAdapter } from './ThreeDmolAdapter';

const adapters: MolecularRendererAdapter[] = [new ThreeDmolAdapter(), new MolstarAdapter()];

export const pickMolecularRenderer = (
  model: MoleculeRenderModel,
): MolecularRendererAdapter | null => {
  for (const adapter of adapters) {
    if (adapter.supports(model)) {
      return adapter;
    }
  }
  return null;
};
