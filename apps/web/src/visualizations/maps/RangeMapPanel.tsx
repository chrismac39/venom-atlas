interface RangeLayer {
  id: string;
  layerType: string;
  geometryAssetId?: string;
  sourceGeometryAssetId?: string;
  geometryFeatureCount?: number;
  summary: string;
}

import { OpenLayersGeographyMap } from './OpenLayersGeographyMap';

export const RangeMapPanel = ({ ranges, speciesId }: { ranges: RangeLayer[]; speciesId?: string }) => {
  const mappedRanges = ranges.filter((range) => range.geometryAssetId);

  return (
    <section className="panel" aria-label="Geographic range panel">
      <h3>Documented geography</h3>
      {mappedRanges.length > 0 || speciesId ? (
        <div className="range-map-stack">
          <figure className="range-map-figure">
              <OpenLayersGeographyMap ranges={mappedRanges} speciesId={speciesId} />
              <figcaption>
                <strong>Interactive documented geography.</strong>{' '}
                Toggle native, introduced, uncertain, and confirmed occurrence layers. Observations indicate
                recorded presence, not a complete range boundary or current occupancy.
              </figcaption>
          </figure>
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
