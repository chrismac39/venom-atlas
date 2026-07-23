import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { ExposureRoute, GeographicRange, Venom } from '@venom-atlas/domain';
import type { OrganismDetail, VenomDetail } from '../../services/contracts';
import { atlasApi } from '../../services/apiClient';
import { DeliveryMechanismDiagram } from '../../visualizations/svg/DeliveryMechanismDiagram';
import { CitationList } from '../../components/CitationList';
import { EvidenceBadge } from '../../components/EvidenceBadge';
import { RouteEntityNotFound } from '../../components/RouteEntityNotFound';
import {
  defaultOrganismSlug,
  isKnownOrganismSlug,
  organismIdFromSlug,
  organismSlugFromId,
  toxinSlugFromId,
} from '../../services/atlasRouting';

interface OrganismProfileData {
  organismDetail: OrganismDetail;
  ranges: GeographicRange[];
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

const geographyLabelByLayer: Record<string, string> = {
  native_range: 'Native range',
  introduced_range: 'Introduced range',
  confirmed_occurrence: 'Confirmed occurrence',
  habitat_context: 'Habitat context',
  uncertain_range: 'Uncertain range',
};

const geographyCountryHintsByOrganismId: Record<string, Partial<Record<string, string[]>>> = {
  'org-solenopsis-invicta': {
    native_range: ['Argentina'],
    introduced_range: ['United States', 'China', 'Australia'],
  },
};

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

const formatCountryList = (countries: string[]): string => {
  if (countries.length === 1) {
    return countries[0] ?? '';
  }
  if (countries.length === 2) {
    return `${countries[0] ?? ''} and ${countries[1] ?? ''}`;
  }
  return `${countries.slice(0, 2).join(', ')} and others`;
};

const geographyFolderLabel = (organismId: string, layerType: string): string => {
  const baseLabel = geographyLabelByLayer[layerType] ?? 'Other range data';
  const hintedCountries = geographyCountryHintsByOrganismId[organismId]?.[layerType] ?? [];

  if (hintedCountries.length === 0) {
    return baseLabel;
  }

  return `${baseLabel}: ${formatCountryList(hintedCountries)}`;
};

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

export const OrganismDetailPage = () => {
  const [data, setData] = useState<OrganismProfileData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { organismSlug } = useParams();
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
      const [organismDetail, ranges, venoms] = await Promise.all([
        atlasApi.getOrganism(organismId),
        atlasApi.getOrganismRange(organismId),
        atlasApi.getOrganismVenoms(organismId),
      ]);

      const venomDetails = await Promise.all(venoms.map((venom) => atlasApi.getVenom(venom.id)));

      setData({
        organismDetail,
        ranges,
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

  const resolvedOrganismSlug = organismSlugFromId(data?.organismDetail.organism.id);

  if (loadError) {
    return <section className="panel">{loadError}</section>;
  }

  if (!data) {
    return <section className="panel">Loading organism...</section>;
  }

  const { organismDetail, ranges, venomDetails } = data;
  const { organism, taxonomy, deliveryMechanism } = organismDetail;
  const uniqueToxins = Array.from(
    new Set(venomDetails.flatMap((detail) => detail.toxins.map((toxin) => toxin.displayName))),
  );
  const geographicSummaries = ranges.map((range) => ({
    id: range.id,
    label: geographyFolderLabel(organism.id, range.layerType),
    summary: range.summary,
    evidence: range.evidence,
  }));
  const externalProfile = externalProfileByOrganismId[organism.id];
  const toxinCategorySummary = summarizeToxinCategory(data.venoms, venomDetails);
  const humanExposureSummary = summarizeHumanExposure(deliveryMechanism?.route);

  return (
    <section className="panel organism-story-shell">
      <section className="grid organism-story">
        <article className="organism-story-section organism-overview-sticky">
          <h1>
            {organism.scientificName} ({organism.commonName})
          </h1>
          <p>{organism.overview}</p>
          <div className="organism-summary-details">
            <section className="organism-summary-pill">
              <h3>Toxin category</h3>
              <p>{toxinCategorySummary}</p>
            </section>
            <section className="organism-summary-pill">
              <h3>Exposure to humans</h3>
              <p>{humanExposureSummary}</p>
            </section>
          </div>
        </article>

        <section className="organism-story-section">
          <h2>Species snapshot</h2>
          <div className="organism-snapshot-layout">
            <div className="organism-snapshot-text">
              <p className="organism-taxonomy-path" aria-label="Taxonomic path">
                {taxonomy?.kingdom ?? 'Unknown kingdom'} / {taxonomy?.phylum ?? 'Unknown phylum'} /{' '}
                {taxonomy?.className ?? 'Unknown class'} / {taxonomy?.order ?? 'Unknown order'} /{' '}
                {taxonomy?.family ?? 'Unknown family'} / {taxonomy?.genus ?? 'Unknown genus'} /{' '}
                {taxonomy?.species ?? 'Unknown species'}
              </p>
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

        <section className="organism-story-section organism-story-section-large">
          <h2>Range map</h2>
          <Link to={`/organisms/${resolvedOrganismSlug}/geography`}>Open geography page</Link>
          <ul className="organism-compact-list">
            {geographicSummaries.map((entry) => (
              <li key={entry.id}>
                <strong>{entry.label}</strong>
                <p className="muted">{entry.summary}</p>
              </li>
            ))}
          </ul>
          {externalProfile ? (
            <div className="organism-antmaps-wrap">
              <h3>AntMaps embed</h3>
              <iframe
                src={externalProfile.antMapsEmbedUrl}
                title={`${organism.scientificName} range map from AntMaps`}
                loading="lazy"
                className="organism-antmaps-embed"
              />
              <p className="muted">
                Embedded AntMaps species view. Data and cartography remain with AntMaps.
              </p>
            </div>
          ) : null}
        </section>

        <section className="organism-story-section">
          <h2>Toxin delivery mechanism</h2>
          {deliveryMechanism ? (
            <>
              <EvidenceBadge evidence={deliveryMechanism.evidence} />
              <p>{deliveryMechanism.summary}</p>
              <ol>
                {deliveryMechanism.sequence.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <h3>Sources</h3>
              <CitationList citationIds={deliveryMechanism.evidence.citationIds} />
            </>
          ) : (
            <p className="muted">Delivery mechanism data not yet sourced.</p>
          )}
        </section>

        <div className="organism-story-section">
          <DeliveryMechanismDiagram />
        </div>

        <section className="organism-story-section">
          <h2>Venom profile snapshot</h2>
          <p>
            <strong>Venom records:</strong> {data.venoms.length}
          </p>
          <p>
            <strong>Featured toxin entities:</strong>{' '}
            {uniqueToxins.length > 0 ? uniqueToxins.join(', ') : 'Data not yet sourced.'}
          </p>
          {venomDetails.length > 0 ? (
            <ul>
              {venomDetails.map((venomDetail) => (
                <li key={venomDetail.venom.id}>
                  <strong>{venomDetail.venom.name}</strong> ({venomDetail.toxins.length} toxin
                  {venomDetail.toxins.length === 1 ? '' : 's'})
                  <div>
                    <EvidenceBadge evidence={venomDetail.venom.evidence} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No venom records are currently linked to this organism.</p>
          )}
          <h3>Linked atlas paths</h3>
          <ul>
            <li>
              <Link to={`/organisms/${resolvedOrganismSlug}/venom`}>View venom story</Link>
            </li>
            <li>
              <Link to={`/toxins/${toxinSlugFromId('tox-solenopsin-a')}`}>
                View Solenopsin A molecule page
              </Link>
            </li>
          </ul>
        </section>
      </section>
    </section>
  );
};
