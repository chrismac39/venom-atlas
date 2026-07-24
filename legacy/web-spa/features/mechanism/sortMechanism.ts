import type { MechanismStep } from '@venom-atlas/domain';

export const sortMechanismSteps = (steps: MechanismStep[]): MechanismStep[] => {
  return [...steps].sort((a, b) => a.order - b.order);
};
