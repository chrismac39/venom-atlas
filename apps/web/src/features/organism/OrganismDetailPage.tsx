import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ExposureRoute, Venom } from '@venom-atlas/domain';
import type { OrganismDetail, VenomDetail } from '../../services/contracts';
import { atlasApi } from '../../services/apiClient';
import { RouteEntityNotFound } from '../../components/RouteEntityNotFound';
import { formatTaxonomyValueForFramework } from '../atlas/organismMonopageFramework';
import {
  defaultOrganismSlug,
  isKnownOrganismSlug,
  organismIdFromSlug,
  organismSlugFromId,
} from '../../services/atlasRouting';

interface OrganismProfileData {
  organismDetail: OrganismDetail;
  venoms: Venom[];
  venomDetails: VenomDetail[];
}

interface ExternalSpeciesProfile {
  sourceLabel: string;
  sourceUrl: string;
  antMapsEmbedUrl: string;
  summaryPoints: string[];
  imageUrls: string[];
}

const externalProfileByOrganismId: Record<string, ExternalSpeciesProfile> = {
  'org-solenopsis-invicta': {
    sourceLabel: 'AntWiki',
    sourceUrl: 'https://www.antwiki.org/wiki/Solenopsis_invicta',
    antMapsEmbedUrl: 'https://antmaps.org/?mode=species&species=Solenopsis.invicta',
    summaryPoints: [
      'Solenopsis invicta is a social, colony-forming ant known for fast collective responses when nest structure is disturbed. Workers recruit nestmates quickly through pheromone signaling, then switch from exploration to defense in coordinated waves. In practice, small initial contact events can escalate quickly where colony density is high or disturbance is repeated over short intervals.',
      'Colony organization contributes to this rapid shift in behavior. Workers are polymorphic, and size-based task flexibility supports foraging, brood care, mound maintenance, and defense within the same colony network. This functional structure helps explain why activity around food resources, nest entrances, and disturbed soil can transition from low-intensity movement to concentrated defensive pressure in a short time window.',
      'The species is commonly associated with open, sun-exposed, and human-managed environments such as pasture margins, roadsides, turf, and agricultural edges. Colonies often build conspicuous earthen mounds and may occur at high local density, increasing encounter frequency for people who walk, work, or perform ground-level maintenance in these habitats. In introduced ranges, these same traits are linked with ecological pressure on native ant assemblages and shifts in local invertebrate community structure.',
      'Behavior relevant to venom delivery is typically described as a grip-and-sting sequence: workers anchor with the mandibles and pivot to deliver repeated stings. This repeated stinging behavior is one reason encounters can produce multiple localized lesions in a short period, especially when workers recruit rapidly from nearby nest zones. For people and animals entering active foraging or defensive areas, exposure risk is shaped by colony density, disturbance intensity, and time spent in infested habitat.',
    ],
    imageUrls: [
      '/images/organisms/solenopsis-invicta/solenopsis-invicta-head-casent0104523.png',
      '/images/organisms/solenopsis-invicta/solenopsis-invicta-profile-casent0104523.png',
    ],
  },
};

interface TaxonomyRankEntry {
  key: string;
  englishLabel: string;
  latinLabel: string;
  value: string;
}

const summarizeToxinCategory = (venoms: Venom[], venomDetails: VenomDetail[]): string => {
  if (venoms.length > 0) {
    const toxinNames = Array.from(
      new Set(venomDetails.flatMap((detail) => detail.toxins.map((toxin) => toxin.displayName))),
    );
    const componentCategories = Array.from(
      new Set(
        venomDetails
          .flatMap((detail) => detail.components.map((component) => component.componentCategory))
          .filter((category) => category.trim().length > 0),
      ),
    );

    const leadCompound = toxinNames[0] ?? 'mixed compounds';
    if (componentCategories.length > 0) {
      const componentSummary = componentCategories.slice(0, 2).join(' and ');
      return `Venom - ${leadCompound}, which includes ${componentSummary}.`;
    }

    return `Venom - ${leadCompound}.`;
  }

  return 'Not yet classified. No verified venom, poison, or secretion profile is currently linked.';
};

const summarizeHumanExposure = (route: ExposureRoute | undefined): string => {
  if (route === 'sting') {
    return 'Usually through stings during nest disturbance or outdoor contact with workers.';
  }
  if (route === 'contact') {
    return 'Usually through skin contact with the organism or its secretions.';
  }
  if (route === 'ingestion') {
    return 'Usually through accidental or intentional ingestion.';
  }
  if (route === 'inhalation') {
    return 'Usually through inhalation of airborne particles or aerosols.';
  }

  return 'Human exposure route is not yet clearly defined.';
};

interface OrganismDetailPageProps {
  organismSlugOverride?: string;
  showInlineSummary?: boolean;
  showOverviewLine?: boolean;
}

export const OrganismDetailPage = ({
  organismSlugOverride,
  showInlineSummary = true,
  showOverviewLine = true,
}: OrganismDetailPageProps = {}) => {
  const [data, setData] = useState<OrganismProfileData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { organismSlug: routeOrganismSlug } = useParams();
  const organismSlug = organismSlugOverride ?? routeOrganismSlug;
  const unknownSlug = organismSlug ? !isKnownOrganismSlug(organismSlug) : false;

  useEffect(() => {
    if (unknownSlug) {
      setData(null);
      setLoadError(null);
      return;
    }

    const load = async (): Promise<void> => {
      setLoadError(null);
      const organismId = organismIdFromSlug(organismSlug);
      const [organismDetail, venoms] = await Promise.all([
        atlasApi.getOrganism(organismId),
        atlasApi.getOrganismVenoms(organismId),
      ]);

      const venomDetails = await Promise.all(venoms.map((venom) => atlasApi.getVenom(venom.id)));

      setData({
        organismDetail,
        venoms,
        venomDetails,
      });
    };

    void load().catch((error: unknown) => {
      console.error(error);
      setData(null);
      setLoadError('Unable to load organism data right now. Please try again.');
    });
  }, [organismSlug, unknownSlug]);

  if (unknownSlug) {
    return (
      <RouteEntityNotFound
        title="Organism not found"
        message={`No organism is mapped to slug "${organismSlug}".`}
        fallbackHref={`/organisms/${defaultOrganismSlug}`}
        fallbackLabel="Open Solenopsis invicta"
      />
    );
  }

  if (loadError) {
    return <section className="panel">{loadError}</section>;
  }

  if (!data) {
    return <section className="panel">Loading organism...</section>;
  }

  const { organismDetail, venomDetails } = data;
  const { organism, taxonomy } = organismDetail;
  const externalProfile = externalProfileByOrganismId[organism.id];
  const toxinCategorySummary = summarizeToxinCategory(data.venoms, venomDetails);
  const humanExposureSummary = summarizeHumanExposure(organismDetail.deliveryMechanism?.route);
  const speciesWithGenus = (() => {
    const species = taxonomy?.species?.trim();
    const genus = taxonomy?.genus?.trim();

    if (!species) {
      return undefined;
    }

    if (!genus) {
      return species;
    }

    const speciesLower = species.toLowerCase();
    const genusLower = genus.toLowerCase();
    if (speciesLower === genusLower || speciesLower.startsWith(`${genusLower} `)) {
      return species;
    }

    return `${genus} ${species}`;
  })();
  const taxonomyRanks: TaxonomyRankEntry[] = [
    {
      key: 'kingdom',
      englishLabel: 'Kingdom',
      latinLabel: 'Regnum',
      value: taxonomy?.kingdom ?? 'Unknown kingdom',
    },
    {
      key: 'phylum',
      englishLabel: 'Phylum',
      latinLabel: 'Phylum',
      value: taxonomy?.phylum ?? 'Unknown phylum',
    },
    {
      key: 'class',
      englishLabel: 'Class',
      latinLabel: 'Classis',
      value: taxonomy?.className ?? 'Unknown class',
    },
    {
      key: 'order',
      englishLabel: 'Order',
      latinLabel: 'Ordo',
      value: taxonomy?.order ?? 'Unknown order',
    },
    {
      key: 'family',
      englishLabel: 'Family',
      latinLabel: 'Familia',
      value: taxonomy?.family ?? 'Unknown family',
    },
    {
      key: 'genus',
      englishLabel: 'Genus',
      latinLabel: 'Genus',
      value: taxonomy?.genus ?? 'Unknown genus',
    },
    {
      key: 'species',
      englishLabel: 'Species',
      latinLabel: 'Species',
      value: formatTaxonomyValueForFramework('species', speciesWithGenus),
    },
  ];

  return (
    <section className="panel organism-story-shell">
      <section className="grid organism-story">
        <article className="organism-story-section organism-overview-sticky">
          <h1>
            {organism.scientificName} ({organism.commonName})
          </h1>
          {showOverviewLine ? <p>{organism.overview}</p> : null}
          {showInlineSummary ? (
            <div className="organism-summary-details">
              <section className="organism-summary-pill ui-surface-glass ui-hover-lift">
                <h3>Toxin category</h3>
                <p>{toxinCategorySummary}</p>
              </section>
              <section className="organism-summary-pill ui-surface-glass ui-hover-lift">
                <h3>Exposure to humans</h3>
                <p>{humanExposureSummary}</p>
              </section>
            </div>
          ) : null}
        </article>

        <section className="organism-story-section">
          <h2>Species snapshot</h2>
          <section className="organism-taxonomy-path" aria-label="Taxonomic hierarchy">
            <div className="organism-taxonomy-matrix" aria-hidden="true">
              {taxonomyRanks.map((rank) => (
                <div className={`organism-taxonomy-rank organism-taxonomy-rank-${rank.key}`} key={rank.key}>
                  <span className="organism-taxonomy-rank-label">{rank.latinLabel}</span>
                  <span className="organism-taxonomy-rank-value">{rank.value}</span>
                </div>
              ))}
            </div>
            <ul className="organism-taxonomy-grid-sr-only">
              {taxonomyRanks.map((rank) => (
                <li key={rank.key}>
                  <strong>{rank.englishLabel}</strong> ({rank.latinLabel}): {rank.value}
                </li>
              ))}
            </ul>
          </section>
          <div className="organism-snapshot-layout">
            <div className="organism-snapshot-text">
              <h3>Reference summary</h3>
              {externalProfile ? (
                <>
                  {externalProfile.summaryPoints.map((point) => (
                    <p key={point}>{point}</p>
                  ))}
                  <p className="muted">Summarized from an external species reference page.</p>
                  <a href={externalProfile.sourceUrl} target="_blank" rel="noreferrer">
                    Open {externalProfile.sourceLabel}
                  </a>
                </>
              ) : (
                <p className="muted">Reference summary not yet configured for this organism.</p>
              )}
            </div>
            <aside className="organism-snapshot-media">
              <h3>Reference images</h3>
              {externalProfile && externalProfile.imageUrls.length > 0 ? (
                <div className="organism-image-strip">
                  {externalProfile.imageUrls.map((imageUrl) => (
                    <img src={imageUrl} alt={`${organism.scientificName} reference`} key={imageUrl} />
                  ))}
                </div>
              ) : (
                <p className="muted">Reference images not yet configured for this organism.</p>
              )}
            </aside>
          </div>
        </section>

      </section>
    </section>
  );
};
