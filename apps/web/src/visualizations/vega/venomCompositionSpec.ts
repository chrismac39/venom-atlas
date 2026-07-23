import type { ToxinComponent } from '@venom-atlas/domain';
import type { VisualizationSpec } from 'vega-embed';

export const buildVenomCompositionSpec = (components: ToxinComponent[]): VisualizationSpec => ({
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  width: 'container',
  mark: {
    type: 'point',
    filled: true,
    size: 180,
  },
  data: {
    values: components.map((component, index) => ({
      category: component.componentCategory,
      abundance: component.abundanceQualifier ?? 'not_quantified',
      confidence: component.evidence.confidence,
      order: index,
    })),
  },
  encoding: {
    y: { field: 'category', type: 'nominal', sort: '-x', title: 'Component category' },
    x: {
      field: 'abundance',
      type: 'ordinal',
      sort: ['major', 'moderate', 'minor', 'present', 'not_quantified'],
      title: 'Relative evidence-aware abundance',
    },
    color: {
      field: 'confidence',
      type: 'nominal',
      scale: {
        domain: ['high', 'moderate', 'low', 'unknown'],
        range: ['#5f8b6f', '#988d56', '#9b614a', '#6b6f7a'],
      },
    },
    tooltip: [
      { field: 'category', type: 'nominal' },
      { field: 'abundance', type: 'nominal' },
      { field: 'confidence', type: 'nominal' },
    ],
  },
});
