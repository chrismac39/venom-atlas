import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Organism, Venom } from '@venom-atlas/domain';
import { defaultOrganismSlug, defaultToxinSlug } from '../../services/atlasRouting';
import { atlasApi } from '../../services/apiClient';
import { useAtlasSelection } from '../../state/atlasSelection';
import { organismSlugFromId } from '../../services/atlasRouting';
import { OrganismDetailPage } from '../organism/OrganismDetailPage';
import { GeographyPage } from '../geography/GeographyPage';
import { MechanismPage } from '../mechanism/MechanismPage';
import { VenomPage } from '../venom/VenomPage';
import { MoleculePage } from '../molecule/MoleculePage';
import { PhysiologyPage } from '../physiology/PhysiologyPage';
import type { VenomDetail } from '../../services/contracts';
import {
  classifyOrganismClass,
  getMonopageFrameworkVariant,
  type MonopageSectionKind,
  type OrganismClassKey,
} from './organismMonopageFramework';

type OrganismSortMode = 'scientific_asc' | 'scientific_desc' | 'common_asc' | 'common_desc';

interface MonopageSummary {
  speciesLabel: string;
  overview: string;
  toxinCategory: string;
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

export const AtlasMonopage = () => {
  const rootRef = useRef<HTMLElement | null>(null);
  const globalSummaryRef = useRef<HTMLDivElement | null>(null);
  const { dispatch } = useAtlasSelection();
  const [organisms, setOrganisms] = useState<Organism[]>([]);
  const [selectedOrganismSlug, setSelectedOrganismSlug] = useState<string>(defaultOrganismSlug);
  const [selectionLocked, setSelectionLocked] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [sortMode, setSortMode] = useState<OrganismSortMode>('scientific_asc');
  const [summary, setSummary] = useState<MonopageSummary | null>(null);
  const [selectedOrganismClassKey, setSelectedOrganismClassKey] =
    useState<OrganismClassKey>('unknown');

  const frameworkVariant = useMemo(
    () => getMonopageFrameworkVariant(selectedOrganismClassKey, selectedOrganismSlug),
    [selectedOrganismClassKey, selectedOrganismSlug],
  );

  const sectionHref = (sectionKind: MonopageSectionKind): string => {
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

  const sectionBody = (sectionKind: MonopageSectionKind): ReactNode => {
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

  useEffect(() => {
    const loadOrganisms = async () => {
      const payload = await atlasApi.listOrganisms();
      setOrganisms(payload);
      const preferredOrganism = payload[0];
      if (preferredOrganism) {
        setSelectedOrganismSlug(organismSlugFromId(preferredOrganism.id));
      }
    };

    void loadOrganisms().catch((error: unknown) => {
      console.error(error);
      setLoadError('Unable to load organisms. Try refreshing the page.');
    });
  }, []);

  useEffect(() => {
    if (!selectionLocked) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectionLocked]);

  const sortedOrganisms = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase();
    const filtered = normalizedQuery
      ? organisms.filter((organism) => {
          const scientific = organism.scientificName.toLowerCase();
          const common = organism.commonName.toLowerCase();
          return scientific.includes(normalizedQuery) || common.includes(normalizedQuery);
        })
      : [...organisms];

    return filtered.sort((a, b) => {
      if (sortMode === 'scientific_desc') {
        return b.scientificName.localeCompare(a.scientificName);
      }
      if (sortMode === 'common_asc') {
        return a.commonName.localeCompare(b.commonName);
      }
      if (sortMode === 'common_desc') {
        return b.commonName.localeCompare(a.commonName);
      }
      return a.scientificName.localeCompare(b.scientificName);
    });
  }, [organisms, searchValue, sortMode]);

  const chooseOrganism = (organism: Organism) => {
    const slug = organismSlugFromId(organism.id);
    setSelectedOrganismSlug(slug);
    dispatch({ type: 'reset', organismId: organism.id });
    setSelectionLocked(false);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
  };

  useEffect(() => {
    const loadSummary = async () => {
      const organismId = organisms.find((entry) => organismSlugFromId(entry.id) === selectedOrganismSlug)?.id;

      if (!organismId) {
        return;
      }

      const [organismDetail, venoms] = await Promise.all([
        atlasApi.getOrganism(organismId),
        atlasApi.getOrganismVenoms(organismId),
      ]);
      const venomDetails = await Promise.all(venoms.map((venom) => atlasApi.getVenom(venom.id)));

      setSummary({
        speciesLabel: `${organismDetail.organism.scientificName} (${organismDetail.organism.commonName})`,
        overview: organismDetail.organism.overview,
        toxinCategory: summarizeToxinCategory(venoms, venomDetails),
      });
      setSelectedOrganismClassKey(classifyOrganismClass(organismDetail.taxonomy?.className));
    };

    void loadSummary().catch((error: unknown) => {
      console.error(error);
      setSummary(null);
    });
  }, [organisms, selectedOrganismSlug]);

  useEffect(() => {
    if (selectionLocked) {
      document.documentElement.style.setProperty('--global-summary-height', '0px');
      return;
    }

    const summaryEl = globalSummaryRef.current;
    if (!summaryEl) {
      return;
    }

    const setSummaryHeight = () => {
      const summaryHeight = Math.ceil(summaryEl.getBoundingClientRect().height);
      document.documentElement.style.setProperty('--global-summary-height', `${summaryHeight}px`);
    };

    setSummaryHeight();
    const observer = new ResizeObserver(setSummaryHeight);
    observer.observe(summaryEl);
    window.addEventListener('resize', setSummaryHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', setSummaryHeight);
      document.documentElement.style.setProperty('--global-summary-height', '0px');
    };
  }, [selectionLocked, summary]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-scroll-section]'));
    if (sections.length === 0) {
      return;
    }

    sections[0]?.setAttribute('data-in-focus', 'true');

    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!mostVisible) {
          return;
        }

        for (const section of sections) {
          section.removeAttribute('data-in-focus');
        }

        if (mostVisible.target instanceof HTMLElement) {
          mostVisible.target.setAttribute('data-in-focus', 'true');
        }
      },
      {
        threshold: [0.2, 0.35, 0.5, 0.65],
        rootMargin: '-8% 0px -35% 0px',
      },
    );

    for (const section of sections) {
      observer.observe(section);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

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
            dedicatedHref={sectionHref(section.kind)}
            dedicatedLabel={section.dedicatedLabel}
          >
            {sectionBody(section.kind)}
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
                  onChange={(event) => setSearchValue(event.target.value)}
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
                  onChange={(event) => setSortMode(event.target.value as OrganismSortMode)}
                >
                  <option value="scientific_asc">Scientific name A-Z</option>
                  <option value="scientific_desc">Scientific name Z-A</option>
                  <option value="common_asc">Common name A-Z</option>
                  <option value="common_desc">Common name Z-A</option>
                </select>
              </label>
            </div>
            {loadError ? <p>{loadError}</p> : null}
            {!loadError && organisms.length === 0 ? <p>Loading organism options...</p> : null}
            {!loadError && organisms.length > 0 && sortedOrganisms.length === 0 ? (
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
