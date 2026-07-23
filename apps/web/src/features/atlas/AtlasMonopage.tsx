import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Organism, Venom } from '@venom-atlas/domain';
import { defaultOrganismSlug, defaultToxinSlug } from '../../services/atlasRouting';
import { atlasApi } from '../../services/apiClient';
import { useAtlasSelection } from '../../state/atlasSelection';
import { organismSlugFromId } from '../../services/atlasRouting';
import { LandingPage } from './LandingPage';
import { OrganismsPage } from '../organism/OrganismsPage';
import { OrganismDetailPage } from '../organism/OrganismDetailPage';
import { GeographyPage } from '../geography/GeographyPage';
import { MechanismPage } from '../mechanism/MechanismPage';
import { VenomPage } from '../venom/VenomPage';
import { MoleculePage } from '../molecule/MoleculePage';
import { PhysiologyPage } from '../physiology/PhysiologyPage';
import type { VenomDetail } from '../../services/contracts';

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
      const target = document.getElementById('section-organism-profile');
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        <section
          id="section-intro"
          className="atlas-scroll-section atlas-scroll-section-hero"
          data-scroll-section
          tabIndex={-1}
        >
          <LandingPage />
        </section>

        <ScrollSection
          id="section-organisms"
          title="Organism Directory"
          dedicatedHref="/organisms"
          dedicatedLabel="Open dedicated directory"
        >
          <OrganismsPage embedded />
        </ScrollSection>

        <ScrollSection
          id="section-organism-profile"
          title="Organism Profile"
          dedicatedHref={`/organisms/${selectedOrganismSlug}`}
          dedicatedLabel="Open dedicated organism page"
        >
          <OrganismDetailPage
            organismSlugOverride={selectedOrganismSlug}
            showInlineSummary={false}
            showOverviewLine={false}
          />
        </ScrollSection>

        <ScrollSection
          id="section-geography"
          title="Geography"
          dedicatedHref={`/organisms/${selectedOrganismSlug}/geography`}
          dedicatedLabel="Open dedicated geography page"
        >
          <GeographyPage organismSlugOverride={selectedOrganismSlug} />
        </ScrollSection>

        <ScrollSection
          id="section-mechanisms"
          title="Mechanisms"
          dedicatedHref={`/toxins/${defaultToxinSlug}/mechanism`}
          dedicatedLabel="Open dedicated mechanism page"
        >
          <MechanismPage />
        </ScrollSection>

        <ScrollSection
          id="section-toxin-categorization"
          title="Toxin Categorization"
          dedicatedHref={`/organisms/${selectedOrganismSlug}/venom`}
          dedicatedLabel="Open dedicated categorization page"
        >
          <VenomPage organismSlugOverride={selectedOrganismSlug} mode="categorization" />
        </ScrollSection>

        <ScrollSection
          id="section-toxin-charts"
          title="Toxin Charts"
          dedicatedHref={`/organisms/${selectedOrganismSlug}/venom`}
          dedicatedLabel="Open dedicated chart page"
        >
          <VenomPage organismSlugOverride={selectedOrganismSlug} mode="charts" />
        </ScrollSection>

        <ScrollSection
          id="section-chemistry"
          title="Chemistry"
          dedicatedHref={`/toxins/${defaultToxinSlug}`}
          dedicatedLabel="Open dedicated chemistry page"
        >
          <MoleculePage />
        </ScrollSection>

        <ScrollSection
          id="section-human-physiology"
          title="Human Physiology"
          dedicatedHref={`/toxins/${defaultToxinSlug}/physiology`}
          dedicatedLabel="Open dedicated physiology page"
        >
          <PhysiologyPage />
        </ScrollSection>
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
