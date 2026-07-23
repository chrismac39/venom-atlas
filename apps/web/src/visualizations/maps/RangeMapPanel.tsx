import type { GeographicRange } from '@venom-atlas/domain';

export const RangeMapPanel = ({ ranges }: { ranges: GeographicRange[] }) => {
  const hasGeometry = ranges.some((range) => !!range.geometryAssetId);

  return (
    <section className="panel" aria-label="Geographic range panel">
      <h3>Geographic ranges</h3>
      {hasGeometry ? (
        <p>Geometry rendering boundary is ready for sourced GeoJSON/TopoJSON integration.</p>
      ) : (
        <div>
          <p>
            Validated source-backed geometry is pending. Map intentionally shows an empty state.
          </p>
          <p className="muted">
            No hand-drawn polygons are used. Last-accessed source metadata should be attached before
            range rendering is enabled.
          </p>
        </div>
      )}
      <ul>
        {ranges.map((range) => (
          <li key={range.id}>
            <strong>{range.layerType}</strong>: {range.summary}
          </li>
        ))}
      </ul>
    </section>
  );
};
