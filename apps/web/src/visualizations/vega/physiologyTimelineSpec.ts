import type { MechanismStep } from '@venom-atlas/domain';
import type { VisualizationSpec } from 'vega-embed';

export const buildPhysiologyTimelineSpec = (steps: MechanismStep[]): VisualizationSpec => ({
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  width: 'container',
  mark: {
    type: 'line',
    point: {
      filled: true,
      size: 120,
    },
  },
  data: {
    values: steps
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((step) => ({
        order: step.order,
        title: step.title,
        pathway:
          step.title.toLowerCase().includes('allergic') ||
          step.description.toLowerCase().includes('allergic')
            ? 'systemic_allergic_possible'
            : step.level === 'tissue' || step.level === 'clinical'
              ? 'local_and_inflammatory'
              : 'direct_venom',
      })),
  },
  encoding: {
    x: { field: 'order', type: 'ordinal', title: 'Progression order' },
    y: { field: 'pathway', type: 'nominal', title: 'Pathway type' },
    color: {
      field: 'pathway',
      scale: {
        domain: ['direct_venom', 'local_and_inflammatory', 'systemic_allergic_possible'],
        range: ['#c58f3a', '#988d56', '#b86842'],
      },
    },
    tooltip: [
      { field: 'title', type: 'nominal' },
      { field: 'pathway', type: 'nominal' },
    ],
  },
});
