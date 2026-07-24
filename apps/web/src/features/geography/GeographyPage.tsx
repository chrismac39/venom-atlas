import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { GeographicRange } from '@venom-atlas/domain';
import { atlasApi } from '../../services/apiClient';
import { RouteEntityNotFound } from '../../components/RouteEntityNotFound';
import { RangeMapPanel } from '../../visualizations/maps/RangeMapPanel';
import {
  defaultOrganismSlug,
  isKnownOrganismSlug,
  organismIdFromSlug,
} from '../../services/atlasRouting';

interface GeographyPageProps {
  organismSlugOverride?: string;
  headingOverride?: string;
  layerModelTitleOverride?: string;
  layerModelSummaryOverride?: string;
  antMapsTitleOverride?: string;
  antMapsEmbedUrlOverride?: string;
}

export const GeographyPage = ({
  organismSlugOverride,
  headingOverride,
  layerModelTitleOverride,
  layerModelSummaryOverride,
  antMapsTitleOverride,
  antMapsEmbedUrlOverride,
}: GeographyPageProps = {}) => {
  const [ranges, setRanges] = useState<GeographicRange[]>([]);
  const { organismSlug: routeOrganismSlug } = useParams();
  const organismSlug = organismSlugOverride ?? routeOrganismSlug;
  const unknownSlug = organismSlug ? !isKnownOrganismSlug(organismSlug) : false;
  const antMapsEmbedUrl = antMapsEmbedUrlOverride;

  useEffect(() => {
    if (unknownSlug) {
      setRanges([]);
      return;
    }
    atlasApi.getOrganismRange(organismIdFromSlug(organismSlug)).then(setRanges).catch(console.error);
  }, [organismSlug, unknownSlug]);

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
