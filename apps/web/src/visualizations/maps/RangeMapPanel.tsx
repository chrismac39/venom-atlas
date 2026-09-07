interface RangeLayer {
  id: string;
  layerType: string;
  geometryAssetId?: string;
  geometryFeatureCount?: number;
  summary: string;
}

const mapAssetPath = (geometryAssetId: string): string =>
  geometryAssetId.replace(/\.geojson$/i, '.svg');

export const RangeMapPanel = ({ ranges }: { ranges: RangeLayer[] }) => {
  const mappedRanges = ranges.filter((range) => range.geometryAssetId);

  return (
    <section className="panel" aria-label="Geographic range panel">
      <h3>Documented geography</h3>
      {mappedRanges.length > 0 ? (
        <div className="range-map-stack">
          {mappedRanges.map((range) => (
            <figure className="range-map-figure" key={range.id}>
              <img
                src={mapAssetPath(range.geometryAssetId as string)}
                alt={`World map showing ${range.geometryFeatureCount ?? 'documented'} occurrence records`}
                loading="lazy"
              />
              <figcaption>
                <strong>{range.geometryFeatureCount ?? 'Documented'} occurrence records.</strong>{' '}
                Observations indicate recorded presence, not a complete range boundary or current occupancy.
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div>
          <p>
            Validated source-backed geography is pending. Map intentionally shows an empty state.
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
