import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { VenomDetail } from '../../../services/contracts';
import { atlasApi } from '../../../services/apiClient';
import { isKnownOrganismSlug, organismIdFromSlug } from '../../../services/atlasRouting';

export interface VenomPageProps {
  organismSlugOverride?: string;
  mode?: 'full' | 'categorization' | 'charts';
  categorizationTitleOverride?: string;
  chartsTitleOverride?: string;
  chartsSummaryOverride?: string;
}

export interface VenomPageOrchestration {
  organismSlug: string | undefined;
  unknownSlug: boolean;
  mode: 'full' | 'categorization' | 'charts';
  data: VenomDetail | null;
  toxinFamilies: string[];
  categorizationTitleOverride: string | undefined;
  chartsTitleOverride: string | undefined;
  chartsSummaryOverride: string | undefined;
}

export const useVenomPageOrchestration = ({
  organismSlugOverride,
  mode = 'full',
  categorizationTitleOverride,
  chartsTitleOverride,
  chartsSummaryOverride,
}: VenomPageProps = {}): VenomPageOrchestration => {
  const [data, setData] = useState<VenomDetail | null>(null);
  const { organismSlug: routeOrganismSlug } = useParams();
  const organismSlug = organismSlugOverride ?? routeOrganismSlug;
  const unknownSlug = organismSlug ? !isKnownOrganismSlug(organismSlug) : false;

  useEffect(() => {
    if (unknownSlug) {
      setData(null);
      return;
    }

    const load = async (): Promise<void> => {
      const organismId = organismIdFromSlug(organismSlug);
      const venoms = await atlasApi.getOrganismVenoms(organismId);
      const featuredVenom = venoms[0];
      if (!featuredVenom) {
        setData(null);
        return;
      }

      const venomDetail = await atlasApi.getVenom(featuredVenom.id);
      setData(venomDetail);
    };

    void load().catch((error: unknown) => {
      console.error(error);
      setData(null);
    });
  }, [organismSlug, unknownSlug]);

  const toxinFamilies = useMemo(
    () =>
      Array.from(
        new Set(data?.toxins.map((toxin) => toxin.family).filter((family): family is string => Boolean(family))),
      ),
    [data],
  );

  return {
    organismSlug,
    unknownSlug,
    mode,
    data,
    toxinFamilies,
    categorizationTitleOverride,
    chartsTitleOverride,
    chartsSummaryOverride,
  };
};
