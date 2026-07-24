export interface LandingTile {
  href: string;
  label: string;
}

export interface LandingPageOrchestration {
  title: string;
  summary: string;
  disclaimer: string;
  tiles: LandingTile[];
}

export const useLandingPageOrchestration = (): LandingPageOrchestration => {
  return {
    title: 'Venom Atlas',
    summary:
      'A connected scientific atlas linking organism biology, venom composition, molecular representation, mechanism hypotheses, human physiology, and range mapping.',
    disclaimer: 'Educational resource. Not medical advice.',
    tiles: [
      { href: '/#section-organism-profile', label: 'Organism profile' },
      { href: '/#section-geography', label: 'Geography and range map' },
      { href: '/#section-mechanisms', label: 'Exposure mechanisms' },
      { href: '/#section-toxin-charts', label: 'Toxin charts and chemistry' },
    ],
  };
};
