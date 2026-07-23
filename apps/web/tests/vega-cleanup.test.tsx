import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { VisualizationSpec } from 'vega-embed';
import { VegaChart } from '../src/visualizations/vega/VegaChart';

const finalize = vi.fn();

vi.mock('vega-embed', () => ({
  default: vi.fn(async () => ({
    view: {
      finalize,
      resize: () => ({ runAsync: async () => undefined }),
      addSignalListener: () => undefined,
    },
  })),
}));

afterEach(() => {
  cleanup();
  finalize.mockClear();
});

describe('VegaChart cleanup', () => {
  it('finalizes old view on unmount', async () => {
    const spec: VisualizationSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      mark: { type: 'point' as const },
      data: { values: [{ x: 1, y: 1 }] },
      encoding: {
        x: { field: 'x', type: 'quantitative' as const },
        y: { field: 'y', type: 'quantitative' as const },
      },
    };

    const { unmount } = render(<VegaChart title="Test" summary="Summary" spec={spec} />);

    await Promise.resolve();
    unmount();

    expect(finalize).toHaveBeenCalled();
  });
});
