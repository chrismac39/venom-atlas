import type { ToxicStrategy } from '@venom-atlas/domain';

export const toxicStrategyLabel = (strategy: ToxicStrategy): string => {
  switch (strategy) {
    case 'toxin_producing':
      return 'toxin-producing';
    case 'venomous':
      return 'venomous';
    case 'poisonous':
      return 'poisonous';
    case 'both':
      return 'venomous and poisonous';
  }
};

export const exposureRouteLabel = (route: string): string => {
  return route === 'production' ? 'toxin production' : route;
};