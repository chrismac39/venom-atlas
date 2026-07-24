import { RouteEntityNotFound } from '../../../components/RouteEntityNotFound';
import { RangeMapPanel } from '../../../visualizations/maps/RangeMapPanel';
import { defaultOrganismSlug } from '../../../services/atlasRouting';
import type { GeographyPageOrchestration } from '../hooks/useGeographyPageOrchestration';

type GeographyPageHostProps = {
  orchestration: GeographyPageOrchestration;
};

const GeographyPageHost = ({ orchestration }: GeographyPageHostProps) => {
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
          <iframe
            className="organism-antmaps-embed"
            src={antMapsEmbedUrl}
            title="AntMaps species distribution explorer"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
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
