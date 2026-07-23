import embed, { type VisualizationSpec } from 'vega-embed';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useResizeObserver } from '../../hooks/useResizeObserver';

type SignalListener = (name: string, value: unknown) => void;

interface VegaChartProps {
  spec: VisualizationSpec;
  summary: string;
  title: string;
  loading?: boolean;
  empty?: boolean;
  onSignal?: {
    signalName: string;
    handler: SignalListener;
  }[];
}

export const VegaChart = ({ spec, summary, title, loading, empty, onSignal }: VegaChartProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<import('vega').View | null>(null);
  const [error, setError] = useState<string | null>(null);
  const specKey = useMemo(() => JSON.stringify(spec), [spec]);

  useResizeObserver(containerRef.current, () => {
    viewRef.current?.resize().runAsync();
  });

  useEffect(() => {
    if (!containerRef.current || loading || empty) {
      return;
    }

    let disposed = false;

    const mount = async (): Promise<void> => {
      try {
        setError(null);
        viewRef.current?.finalize();
        const result = await embed(containerRef.current as HTMLElement, spec, {
          actions: false,
          renderer: 'svg',
        });
        if (disposed) {
          result.view.finalize();
          return;
        }
        viewRef.current = result.view;
        onSignal?.forEach(({ signalName, handler }) => {
          result.view.addSignalListener(signalName, handler);
        });
      } catch (mountError) {
        setError((mountError as Error).message);
      }
    };

    void mount();

    return () => {
      disposed = true;
      viewRef.current?.finalize();
      viewRef.current = null;
    };
  }, [empty, loading, onSignal, specKey, spec]);

  if (loading) {
    return <div className="panel">Loading chart...</div>;
  }

  if (empty) {
    return <div className="panel">No chart data available.</div>;
  }

  if (error) {
    return <div className="panel">Chart failed: {error}</div>;
  }

  return (
    <section className="panel" aria-label={title}>
      <h3>{title}</h3>
      <p className="muted">{summary}</p>
      <div ref={containerRef} />
    </section>
  );
};
