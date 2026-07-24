import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import type { Organism, Venom } from '@venom-atlas/domain';
import { atlasApi } from '../../../services/apiClient';
import { useAtlasSelection } from '../../../state/atlasSelection';
import { defaultOrganismSlug, organismSlugFromId } from '../../../services/atlasRouting';
import type { VenomDetail } from '../../../services/contracts';
import {
  classifyOrganismClass,
  getMonopageFrameworkVariant,
  type OrganismClassKey,
} from '../organismMonopageFramework';

export type OrganismSortMode =
  | 'scientific_asc'
  | 'scientific_desc'
  | 'common_asc'
  | 'common_desc';

export interface MonopageSummary {
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

export interface AtlasMonopageOrchestration {
  rootRef: RefObject<HTMLElement | null>;
  globalSummaryRef: RefObject<HTMLDivElement | null>;
  organisms: Organism[];
  sortedOrganisms: Organism[];
  selectedOrganismSlug: string;
  selectionLocked: boolean;
  loadError: string | null;
  searchValue: string;
  sortMode: OrganismSortMode;
  summary: MonopageSummary | null;
  frameworkVariant: ReturnType<typeof getMonopageFrameworkVariant>;
  onSearchChange: (nextValue: string) => void;
  onSortModeChange: (nextMode: OrganismSortMode) => void;
  chooseOrganism: (organism: Organism) => void;
}

export const useAtlasMonopageOrchestration = (): AtlasMonopageOrchestration => {
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
      const organismId = organisms.find((entry) => organismSlugFromId(entry.id) === selectedOrganismSlug)
        ?.id;

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

  return {
    rootRef,
    globalSummaryRef,
    organisms,
    sortedOrganisms,
    selectedOrganismSlug,
    selectionLocked,
    loadError,
    searchValue,
    sortMode,
    summary,
    frameworkVariant,
    onSearchChange: setSearchValue,
    onSortModeChange: setSortMode,
    chooseOrganism,
  };
};
