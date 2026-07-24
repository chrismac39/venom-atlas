import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { GeographicRange } from '@venom-atlas/domain';
import { atlasApi } from '../../../services/apiClient';
import { isKnownOrganismSlug, organismIdFromSlug } from '../../../services/atlasRouting';

export interface GeographyPageProps {
  organismSlugOverride?: string;
  headingOverride?: string;
  layerModelTitleOverride?: string;
  layerModelSummaryOverride?: string;
  antMapsTitleOverride?: string;
  antMapsEmbedUrlOverride?: string;
}

export interface GeographyPageOrchestration {
  organismSlug: string | undefined;
  unknownSlug: boolean;
  ranges: GeographicRange[];
  headingOverride: string | undefined;
  layerModelTitleOverride: string | undefined;
  layerModelSummaryOverride: string | undefined;
  antMapsTitleOverride: string | undefined;
  antMapsEmbedUrl: string | undefined;
}

export const useGeographyPageOrchestration = ({
  organismSlugOverride,
  headingOverride,
  layerModelTitleOverride,
  layerModelSummaryOverride,
  antMapsTitleOverride,
  antMapsEmbedUrlOverride,
}: GeographyPageProps = {}): GeographyPageOrchestration => {
  const [ranges, setRanges] = useState<GeographicRange[]>([]);
  const { organismSlug: routeOrganismSlug } = useParams();
  const organismSlug = organismSlugOverride ?? routeOrganismSlug;
  const unknownSlug = organismSlug ? !isKnownOrganismSlug(organismSlug) : false;

  useEffect(() => {
    if (unknownSlug) {
      setRanges([]);
      return;
    }

    atlasApi
      .getOrganismRange(organismIdFromSlug(organismSlug))
      .then(setRanges)
      .catch((error: unknown) => console.error(error));
  }, [organismSlug, unknownSlug]);

  return {
    organismSlug,
    unknownSlug,
    ranges,
    headingOverride,
    layerModelTitleOverride,
    layerModelSummaryOverride,
    antMapsTitleOverride,
    antMapsEmbedUrl: antMapsEmbedUrlOverride,
  };
};
