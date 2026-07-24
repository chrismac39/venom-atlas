import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { defaultToxinSlug } from '../../../services/atlasRouting';
import { OrganismDetailPage } from '../../organism/OrganismDetailPage';
import { GeographyPage } from '../../geography/GeographyPage';
import { MechanismPage } from '../../mechanism/MechanismPage';
import { VenomPage } from '../../venom/VenomPage';
import { MoleculePage } from '../../molecule/MoleculePage';
import { PhysiologyPage } from '../../physiology/PhysiologyPage';
import { organismSlugFromId } from '../../../services/atlasRouting';
import type { MonopageSectionKind } from '../organismMonopageFramework';
import type {
  AtlasMonopageOrchestration,
  OrganismSortMode,
} from '../hooks/useAtlasMonopageOrchestration';

interface ScrollSectionProps {
  id: string;
  title: string;
  dedicatedHref: string;
  dedicatedLabel: string;
  children: ReactNode;
}

const ScrollSection = ({ id, title, dedicatedHref, dedicatedLabel, children }: ScrollSectionProps) => {
  return (
    <section id={id} className="atlas-scroll-section" data-scroll-section tabIndex={-1}>
      <header className="atlas-scroll-section-header">
        <h2>{title}</h2>
        <Link to={dedicatedHref}>{dedicatedLabel}</Link>
      </header>
      <div className="atlas-scroll-section-content">{children}</div>
    </section>
  );
};

type AtlasMonopageHostProps = {
  orchestration: AtlasMonopageOrchestration;
};

const sectionHref = (sectionKind: MonopageSectionKind, selectedOrganismSlug: string): string => {
  if (sectionKind === 'organism-profile') {
    return `/organisms/${selectedOrganismSlug}`;
  }
  if (sectionKind === 'geography') {
    return `/organisms/${selectedOrganismSlug}/geography`;
  }
  if (sectionKind === 'mechanisms') {
    return `/toxins/${defaultToxinSlug}/mechanism`;
  }
  if (sectionKind === 'toxin-categorization' || sectionKind === 'toxin-charts') {
    return `/organisms/${selectedOrganismSlug}/venom`;
  }
  if (sectionKind === 'chemistry') {
    return `/toxins/${defaultToxinSlug}`;
  }

  return `/toxins/${defaultToxinSlug}/physiology`;
};

const sectionBody = (
  sectionKind: MonopageSectionKind,
  selectedOrganismSlug: string,
  frameworkVariant: AtlasMonopageOrchestration['frameworkVariant'],
): ReactNode => {
  if (sectionKind === 'organism-profile') {
    return (
      <OrganismDetailPage
        organismSlugOverride={selectedOrganismSlug}
        showInlineSummary={false}
        showOverviewLine={false}
      />
    );
  }
  if (sectionKind === 'geography') {
    const geographyAntMapsProps = frameworkVariant.content.geography.antMapsEmbedUrl
      ? {
          antMapsTitleOverride: frameworkVariant.content.geography.antMapsTitle,
          antMapsEmbedUrlOverride: frameworkVariant.content.geography.antMapsEmbedUrl,
        }
      : {};

    return (
      <GeographyPage
        organismSlugOverride={selectedOrganismSlug}
        headingOverride={frameworkVariant.content.geography.heading}
        layerModelTitleOverride={frameworkVariant.content.geography.layerModelTitle}
        layerModelSummaryOverride={frameworkVariant.content.geography.layerModelSummary}
        {...geographyAntMapsProps}
      />
    );
  }
  if (sectionKind === 'mechanisms') {
    return (
      <MechanismPage
        organismSlugOverride={selectedOrganismSlug}
        naturalTitleOverride={frameworkVariant.mechanisms.naturalTitle}
        humanTitleOverride={frameworkVariant.mechanisms.humanTitle}
      />
    );
  }
  if (sectionKind === 'toxin-categorization') {
    return (
      <VenomPage
        organismSlugOverride={selectedOrganismSlug}
        mode="categorization"
        categorizationTitleOverride={frameworkVariant.content.venom.categorizationTitle}
      />
    );
  }
  if (sectionKind === 'toxin-charts') {
    return (
      <VenomPage
        organismSlugOverride={selectedOrganismSlug}
        mode="charts"
        chartsTitleOverride={frameworkVariant.content.venom.chartsTitle}
        chartsSummaryOverride={frameworkVariant.content.venom.chartsSummary}
      />
    );
  }
  if (sectionKind === 'chemistry') {
    return (
      <MoleculePage
        identityNoteOverride={frameworkVariant.content.chemistry.identityNote}
        structurePanelTitleOverride={frameworkVariant.content.chemistry.structurePanelTitle}
      />
    );
  }

  return (
    <PhysiologyPage
      headingOverride={frameworkVariant.content.physiology.heading}
      pathwaysTitleOverride={frameworkVariant.content.physiology.pathwaysTitle}
      timelineTitleOverride={frameworkVariant.content.physiology.timelineTitle}
      timelineSummaryOverride={frameworkVariant.content.physiology.timelineSummary}
    />
  );
};

const isSortMode = (mode: string): mode is OrganismSortMode => {
  return (
    mode === 'scientific_asc' ||
    mode === 'scientific_desc' ||
    mode === 'common_asc' ||
    mode === 'common_desc'
  );
};

const AtlasMonopageHost = ({ orchestration }: AtlasMonopageHostProps) => {
  const {
    rootRef,
    globalSummaryRef,
    sortedOrganisms,
    selectedOrganismSlug,
    selectionLocked,
    loadError,
    searchValue,
    sortMode,
    summary,
    frameworkVariant,
    onSearchChange,
    onSortModeChange,
    chooseOrganism,
  } = orchestration;

  return (
    <section className={`atlas-monopage-shell${!selectionLocked ? ' has-global-summary' : ''}`}>
      {!selectionLocked && summary ? (
        <aside ref={globalSummaryRef} className="atlas-global-summary-pills" aria-label="Pinned organism summary">
          <section className="atlas-global-summary-strip" role="status" aria-live="polite">
            <p className="atlas-global-summary-line atlas-global-summary-species">{summary.speciesLabel}</p>
            <p className="atlas-global-summary-line">{summary.overview}</p>
            <p className="atlas-global-summary-line">
              <strong>Toxin category:</strong> {summary.toxinCategory}
            </p>
          </section>
        </aside>
      ) : null}

      <section
        ref={rootRef}
        className={`atlas-monopage${selectionLocked ? ' atlas-monopage-locked' : ''}`}
        aria-hidden={selectionLocked}
      >
        {frameworkVariant.sections.map((section) => (
          <ScrollSection
            key={section.id}
            id={section.id}
            title={section.title}
            dedicatedHref={sectionHref(section.kind, selectedOrganismSlug)}
            dedicatedLabel={section.dedicatedLabel}
          >
            {sectionBody(section.kind, selectedOrganismSlug, frameworkVariant)}
          </ScrollSection>
        ))}
      </section>

      {selectionLocked ? (
        <section className="atlas-organism-gate" aria-label="Select an organism to begin">
          <div className="atlas-organism-gate-card panel">
            <h1>Venom Atlas: an interactive guide through interesting toxins in nature</h1>
            <p className="muted">
              Start by choosing an organism. The atlas stays in preview mode until selection, then
              unlocks a continuous scroll through organism profile, geography, mechanisms, toxin
              categorization, BI charts, chemistry, and human physiology.
            </p>
            <p className="muted">
              Framework mode: {frameworkVariant.classLabel}. {frameworkVariant.selectionSubtitle}
            </p>
            <h2>Choose an organism to begin</h2>
            <div className="atlas-organism-gate-toolbar">
              <label className="atlas-organism-gate-search" htmlFor="organism-search-input">
                Search organisms
                <input
                  id="organism-search-input"
                  type="search"
                  value={searchValue}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Type to filter, for example solen"
                  autoComplete="off"
                  spellCheck={false}
                />
              </label>
              <label className="atlas-organism-gate-sort" htmlFor="organism-sort-select">
                Sort
                <select
                  id="organism-sort-select"
                  aria-label="Sort organisms"
                  value={sortMode}
                  onChange={(event) => {
                    if (isSortMode(event.target.value)) {
                      onSortModeChange(event.target.value);
                    }
                  }}
                >
                  <option value="scientific_asc">Scientific name A-Z</option>
                  <option value="scientific_desc">Scientific name Z-A</option>
                  <option value="common_asc">Common name A-Z</option>
                  <option value="common_desc">Common name Z-A</option>
                </select>
              </label>
            </div>
            {loadError ? <p>{loadError}</p> : null}
            {!loadError && sortedOrganisms.length === 0 && searchValue.trim().length === 0 ? (
              <p>Loading organism options...</p>
            ) : null}
            {!loadError && sortedOrganisms.length === 0 && searchValue.trim().length > 0 ? (
              <p className="muted">No organisms match your search.</p>
            ) : null}
            {!loadError && sortedOrganisms.length > 0 ? (
              <div className="atlas-organism-gate-options">
                {sortedOrganisms.map((organism) => {
                  const optionSlug = organismSlugFromId(organism.id);
                  return (
                    <button
                      key={organism.id}
                      type="button"
                      className={`atlas-organism-option${
                        optionSlug === selectedOrganismSlug ? ' atlas-organism-option-selected' : ''
                      }`}
                      onClick={() => chooseOrganism(organism)}
                    >
                      <strong>{organism.scientificName}</strong>
                      <span className="muted">{organism.commonName}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </section>
  );
};

export default AtlasMonopageHost;
