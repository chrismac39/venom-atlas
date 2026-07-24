import { useState } from 'react';
import { RouteEntityNotFound } from '../../../components/RouteEntityNotFound';
import { RangeMapPanel } from '../../../visualizations/maps/RangeMapPanel';
import { defaultOrganismSlug } from '../../../services/atlasRouting';
import type { GeographyPageOrchestration } from '../hooks/useGeographyPageOrchestration';

type GeographyPageHostProps = {
  orchestration: GeographyPageOrchestration;
};

const GeographyPageHost = ({ orchestration }: GeographyPageHostProps) => {
  const [isMapInteractive, setIsMapInteractive] = useState(false);
  const {
    organismSlug,
    unknownSlug,
    ranges,
    headingOverride,
    layerModelTitleOverride,
    layerModelSummaryOverride,
    antMapsTitleOverride,
    antMapsEmbedUrl,
  } = orchestration;

  if (unknownSlug) {
    return (
      <RouteEntityNotFound
        title="Geography page unavailable"
        message={`No organism is mapped to slug "${organismSlug}".`}
        fallbackHref={`/organisms/${defaultOrganismSlug}/geography`}
        fallbackLabel="Open Solenopsis invicta geography"
      />
    );
  }

  return (
    <section className="grid">
      <h1>{headingOverride ?? 'Ecology and geography'}</h1>
      <RangeMapPanel ranges={ranges} />
      {antMapsEmbedUrl ? (
        <section className="panel organism-antmaps-wrap">
          <h3>{antMapsTitleOverride ?? 'Interactive species range map'}</h3>
          <p className="muted organism-antmaps-hint">
            Click the map to interact. Move your cursor out of the map to resume normal page scroll.
          </p>
          <div
            className="organism-antmaps-interaction-layer"
            onMouseLeave={() => setIsMapInteractive(false)}
          >
            <iframe
              className={`organism-antmaps-embed${isMapInteractive ? ' organism-antmaps-embed-interactive' : ''}`}
              src={antMapsEmbedUrl}
              title="AntMaps species distribution explorer"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />

            {!isMapInteractive ? (
              <button
                type="button"
                className="organism-antmaps-overlay"
                onClick={() => setIsMapInteractive(true)}
                aria-label="Enable AntMaps interaction"
              >
                <span className="organism-antmaps-overlay-pill">
                  <span className="organism-antmaps-overlay-title">Click to interact with map</span>
                  <span className="organism-antmaps-overlay-subtitle">
                    Scroll is locked to page until you activate map controls.
                  </span>
                </span>
              </button>
            ) : (
              <button
                type="button"
                className="organism-antmaps-lock-button"
                onClick={() => setIsMapInteractive(false)}
              >
                Lock map
              </button>
            )}
          </div>
        </section>
      ) : null}
      <section className="panel">
        <h3>{layerModelTitleOverride ?? 'Layer model'}</h3>
        <p className="muted">
          {layerModelSummaryOverride ??
            'Native range, introduced range, confirmed occurrence, habitat context, and uncertain range are distinct layer types.'}
        </p>
      </section>
    </section>
  );
};

export default GeographyPageHost;
