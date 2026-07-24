import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Citation, EvidenceAssessment, MechanismStep, ToxinComponent } from '@venom-atlas/domain';
import type { MolecularRepresentation } from '@venom-atlas/visualization-contracts';
import type { AnatomyHighlight } from '@venom-atlas/visualization-contracts';
import type { MoleculeRenderModel } from '../molecular/types';
import { CitationList } from '../components/CitationList';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { MoleculeViewer } from '../molecular/components/MoleculeViewer';
import { StructureComplexViewer } from '../molecular/components/StructureComplexViewer';
import { AnatomySvg } from '../visualizations/svg/AnatomySvg';
import { DeliveryMechanismDiagram } from '../visualizations/svg/DeliveryMechanismDiagram';
import { VegaChart } from '../visualizations/vega/VegaChart';
import { buildPhysiologyTimelineSpec } from '../visualizations/vega/physiologyTimelineSpec';
import { buildVenomCompositionSpec } from '../visualizations/vega/venomCompositionSpec';

type OrganismSortMode = 'scientific_asc' | 'scientific_desc' | 'common_asc' | 'common_desc';

type AtlasSectionKind =
  | 'organism-profile'
  | 'geography'
  | 'mechanisms'
  | 'toxin-categorization'
  | 'toxin-charts'
  | 'chemistry'
  | 'physiology';

interface AtlasSection {
  id: string;
  kind: AtlasSectionKind;
  title: string;
  dedicatedLabel: string;
}

type OrganismClassKey = 'insect' | 'fish' | 'unknown';

export interface AtlasOrganismData {
  slug: string;
  scientificName: string;
  commonName: string;
  overview: string;
  taxonomy: {
    kingdom?: string;
    phylum?: string;
    className?: string;
    order?: string;
    family?: string;
    genus?: string;
    species?: string;
  };
  naturalHistory: string[];
  externalProfile?: {
    sourceLabel: string;
    sourceUrl: string;
    antMapsEmbedUrl?: string;
    summaryPoints: string[];
    imagePaths: string[];
  };
  deliveryMechanism: {
    route: string;
    summary: string;
    sequence: string[];
  };
  habitats: Array<{ id: string; name: string; summary: string }>;
  ecologicalRoles: Array<{ id: string; role: string; summary: string }>;
  geographyRanges: Array<{ id: string; layerType: string; summary: string }>;
  venom: {
    slug: string;
    name: string;
    description: string;
    ecologicalRoleSummary: string;
    evidence: EvidenceAssessment;
    components: ToxinComponent[];
  } | null;
  toxins: Array<{
    id: string;
    slug: string;
    displayName: string;
    family?: string;
    molecularClass: MoleculeRenderModel['molecularClass'];
    formula: string | null;
    molecularWeight: number | null;
    structureDataSource: string | null;
    structure3dUrl?: string;
    structure3dFormat?: 'sdf' | 'mol' | 'mol2' | 'pdb' | 'mmcif';
    structure2dUrl?: string;
    interactionVisualization?: {
      id: string;
      label: string;
      annotationPath: string;
      structureAssetPath: string;
      structureFormat: 'pdb' | 'mmcif';
      evidence: {
        level: 'experimental' | 'computed' | 'illustrative';
        source: string;
        notes?: string;
      };
    };
    evidence: {
      confidence: EvidenceAssessment['confidence'];
      evidenceType: EvidenceAssessment['evidenceType'];
      id: string;
      citationIds: string[];
      notes?: string;
    };
    citations: Citation[];
  }>;
  primaryToxin: {
    slug: string;
    displayName: string;
    molecularClass: MoleculeRenderModel['molecularClass'];
    formula: string | null;
    molecularWeight: number | null;
    structureDataSource: string | null;
    evidence: {
      confidence: EvidenceAssessment['confidence'];
      evidenceType: EvidenceAssessment['evidenceType'];
      id: string;
      citationIds: string[];
      notes?: string;
    };
    structureUrl?: string;
    structureFormat?: 'sdf' | 'mol' | 'mol2' | 'pdb' | 'mmcif';
  } | null;
  mechanismSteps: MechanismStep[];
  physiology: {
    symptoms: Array<{ id: string; name: string; description: string }>;
    effects: Array<{
      id: string;
      order: number;
      title: string;
      description: string;
      pathwayType: 'direct_venom' | 'inflammatory_immune' | 'systemic_allergic';
    }>;
  } | null;
  citations: Citation[];
}

const localHighlights: AnatomyHighlight[] = [
  {
    systemId: 'anat-skin',
    intensity: 'primary',
    label: 'Skin',
    explanation: 'Primary tissue site of sting and lesion progression.',
  },
  {
    systemId: 'anat-peripheral-nerves',
    intensity: 'primary',
    label: 'Peripheral sensory nerves',
    explanation: 'Associated with immediate pain and burning sensations.',
  },
  {
    systemId: 'anat-immune',
    intensity: 'secondary',
    label: 'Inflammatory/immune response',
    explanation: 'Shapes lesion and inflammatory manifestations.',
  },
  {
    systemId: 'anat-respiratory',
    intensity: 'context',
    label: 'Respiratory system',
    explanation: 'Systemic allergic pathway is possible but not default.',
  },
];

const fallbackNaturalStepsByRoute: Record<string, [string, string, string, string]> = {
  sting: ['Target is contacted', 'Body aligns for delivery', 'Stinger penetrates target', 'Venom acts on target'],
  contact: ['Surface contact occurs', 'Secretion is transferred', 'Toxin reaches exposed tissue', 'Local effects begin'],
  ingestion: ['Material is consumed by target', 'Toxin enters digestive tract', 'Compounds are absorbed', 'Effects propagate systemically'],
  inhalation: ['Particles become airborne', 'Target inhales particles', 'Compounds contact airway tissue', 'Respiratory effects begin'],
  unknown: ['Initial contact occurs', 'Delivery pathway begins', 'Toxin reaches target tissue', 'Observable effects follow'],
};

const fallbackHumanStepsByRoute: Record<string, [string, string, string, string]> = {
  sting: ['Human encounter triggers defense', 'Organism anchors to skin', 'Stinger penetrates skin', 'Venom is delivered to tissue'],
  contact: ['Human touches organism or secretion', 'Toxin transfers to skin', 'Local penetration/irritation occurs', 'Symptoms emerge at contact site'],
  ingestion: ['Material is accidentally ingested', 'Toxin enters the gut', 'Absorption into circulation begins', 'Systemic effects may develop'],
  inhalation: ['Aerosolized material is inhaled', 'Compounds reach airway surfaces', 'Irritation/inflammation may occur', 'Respiratory symptoms can escalate'],
  unknown: ['Human contact occurs', 'Likely exposure pathway initiates', 'Toxin reaches vulnerable tissue', 'Clinical effects may follow'],
};

const toFourSteps = (steps: string[]): [string, string, string, string] | null => {
  const normalized = steps.map((step) => step.trim()).filter((step) => step.length > 0);
  const [first, second, third, fourth] = normalized;
  if (!first || !second || !third || !fourth) {
    return null;
  }
  return [first, second, third, fourth];
};

const sections: AtlasSection[] = [
  {
    id: 'section-organism-profile',
    kind: 'organism-profile',
    title: 'Organism Profile',
    dedicatedLabel: 'Open dedicated organism page',
  },
  {
    id: 'section-geography',
    kind: 'geography',
    title: 'Geography',
    dedicatedLabel: 'Open dedicated geography page',
  },
  {
    id: 'section-mechanisms',
    kind: 'mechanisms',
    title: 'Mechanisms',
    dedicatedLabel: 'Open dedicated mechanism page',
  },
  {
    id: 'section-toxin-categorization',
    kind: 'toxin-categorization',
    title: 'Toxin Categorization',
    dedicatedLabel: 'Open dedicated categorization page',
  },
  {
    id: 'section-toxin-charts',
    kind: 'toxin-charts',
    title: 'Toxin Charts',
    dedicatedLabel: 'Open dedicated chart page',
  },
  {
    id: 'section-chemistry',
    kind: 'chemistry',
    title: 'Chemistry and structure',
    dedicatedLabel: 'Open dedicated chemistry page',
  },
  {
    id: 'section-human-physiology',
    kind: 'physiology',
    title: 'Human Physiology',
    dedicatedLabel: 'Open dedicated physiology page',
  },
];

const classifyOrganismClass = (className: string | undefined): OrganismClassKey => {
  const normalized = className?.trim().toLowerCase();
  if (!normalized) {
    return 'unknown';
  }
  if (normalized === 'insecta') {
    return 'insect';
  }
  if (normalized === 'actinopterygii' || normalized === 'chondrichthyes' || normalized === 'pisces') {
    return 'fish';
  }
  return 'unknown';
};

const classLabel = (classKey: OrganismClassKey): string => {
  if (classKey === 'insect') {
    return 'Insect';
  }
  if (classKey === 'fish') {
    return 'Fish';
  }
  return 'General';
};

const selectionSubtitle = (classKey: OrganismClassKey): string => {
  if (classKey === 'insect') {
    return 'Insect profile loaded. The same monopage framework is applied with insect-oriented mechanism context.';
  }
  if (classKey === 'fish') {
    return 'Fish profile loaded. The same monopage framework is applied with fish-oriented interaction context.';
  }
  return 'This organism uses the shared atlas framework. Section content is adapted to available evidence.';
};

const summarizeToxinCategory = (selected: AtlasOrganismData): string => {
  if (!selected.venom || selected.venom.components.length === 0) {
    return 'Not yet classified. No verified venom, poison, or secretion profile is currently linked.';
  }

  const leadCompound = selected.primaryToxin?.displayName ?? 'mixed compounds';
  const categories = Array.from(
    new Set(
      selected.venom.components
        .map((component) => component.componentCategory)
        .filter((category) => category.trim().length > 0),
    ),
  );

  if (categories.length > 0) {
    return `Venom - ${leadCompound}, which includes ${categories.slice(0, 2).join(' and ')}.`;
  }

  return `Venom - ${leadCompound}.`;
};

const firstSentence = (text: string): string => {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return 'Overview not yet sourced.';
  }

  const match = normalized.match(/^.+?[.!?](?:\s|$)/);
  return (match ? match[0] : normalized).trim();
};

const renderChemicalFormula = (formula: string | null): ReactNode => {
  if (!formula) {
    return 'Data not yet sourced.';
  }

  const parts = formula.match(/[A-Z][a-z]?|\d+|[^A-Za-z\d]+/g);
  if (!parts) {
    return formula;
  }

  return (
    <span className="chem-formula" aria-label={`Chemical formula ${formula}`}>
      {parts.map((part, index) =>
        /^\d+$/.test(part) ? <sub key={`${part}-${index}`}>{part}</sub> : <span key={`${part}-${index}`}>{part}</span>,
      )}
    </span>
  );
};

const supportedRepresentations: MolecularRepresentation[] = [
  'ball_and_stick',
  'stick',
  'space_filling',
  'molecular_surface',
  'electrostatic_surface',
  'two_dimensional_skeletal',
];

const supportedComplexRepresentations: MolecularRepresentation[] = [
  'target_complex',
  'cartoon',
  'stick',
  'space_filling',
  'molecular_surface',
  'electrostatic_surface',
];

const sectionHref = (
  sectionKind: AtlasSectionKind,
  selected: AtlasOrganismData,
  selectedToxinSlug?: string,
): string => {
  const toxinSlug = selectedToxinSlug ?? selected.primaryToxin?.slug;

  if (sectionKind === 'organism-profile') {
    return `/organisms/${selected.slug}`;
  }
  if (sectionKind === 'geography') {
    return `/organisms/${selected.slug}/geography`;
  }
  if (sectionKind === 'toxin-categorization' || sectionKind === 'toxin-charts') {
    return `/organisms/${selected.slug}/venom`;
  }
  if (sectionKind === 'mechanisms') {
    return toxinSlug ? `/toxins/${toxinSlug}/mechanism` : '/toxins';
  }
  if (sectionKind === 'chemistry') {
    return toxinSlug ? `/toxins/${toxinSlug}` : '/toxins';
  }
  return toxinSlug ? `/toxins/${toxinSlug}/physiology` : '/effects';
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
        <a href={dedicatedHref}>{dedicatedLabel}</a>
      </header>
      <div className="atlas-scroll-section-content">{children}</div>
    </section>
  );
};

export const AtlasMonopageIsland = ({ organisms }: { organisms: AtlasOrganismData[] }) => {
  const rootRef = useRef<HTMLElement | null>(null);
  const globalSummaryRef = useRef<HTMLDivElement | null>(null);
  const hasAppliedInitialRouteRef = useRef(false);
  const [selectedOrganismSlug, setSelectedOrganismSlug] = useState(organisms[0]?.slug ?? '');
  const [selectedChemistryToxinSlug, setSelectedChemistryToxinSlug] = useState('');
  const [selectionLocked, setSelectionLocked] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [sortMode, setSortMode] = useState<OrganismSortMode>('scientific_asc');
  const [isMapInteractive, setIsMapInteractive] = useState(false);

  useEffect(() => {
    if (hasAppliedInitialRouteRef.current || organisms.length === 0) {
      return;
    }

    hasAppliedInitialRouteRef.current = true;

    const knownSlugs = new Set(organisms.map((organism) => organism.slug));
    const { searchParams, hash } = new URL(window.location.href);
    const selectedFromUrl = searchParams.get('organism');
    const toxinFromUrl = searchParams.get('toxin');
    const hashSectionId = decodeURIComponent(hash.replace('#', '').trim());
    const hasValidSectionHash = sections.some((section) => section.id === hashSectionId);

    if (selectedFromUrl && knownSlugs.has(selectedFromUrl)) {
      setSelectedOrganismSlug(selectedFromUrl);
    }

    if (toxinFromUrl) {
      setSelectedChemistryToxinSlug(toxinFromUrl);
    }

    if (selectedFromUrl || hasValidSectionHash || searchParams.get('unlock') === '1') {
      setSelectionLocked(false);
    }
  }, [organisms]);

  useEffect(() => {
    if (organisms.length === 0) {
      return;
    }

    const knownSlugs = new Set(organisms.map((organism) => organism.slug));

    const applyStateFromUrl = () => {
      const { searchParams, hash } = new URL(window.location.href);
      const selectedFromUrl = searchParams.get('organism');
      const toxinFromUrl = searchParams.get('toxin');
      const hashSectionId = decodeURIComponent(hash.replace('#', '').trim());
      const hasValidSectionHash = sections.some((section) => section.id === hashSectionId);

      if (selectedFromUrl && knownSlugs.has(selectedFromUrl)) {
        setSelectedOrganismSlug(selectedFromUrl);
      }

      if (toxinFromUrl) {
        setSelectedChemistryToxinSlug(toxinFromUrl);
      }

      if (selectedFromUrl || hasValidSectionHash || searchParams.get('unlock') === '1') {
        setSelectionLocked(false);
      }
    };

    const handleHashChange = () => {
      applyStateFromUrl();
    };

    const handlePopState = () => {
      applyStateFromUrl();
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [organisms]);

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

  const selected = useMemo(
    () => organisms.find((entry) => entry.slug === selectedOrganismSlug) ?? organisms[0] ?? null,
    [organisms, selectedOrganismSlug],
  );

  const selectedChemistryToxin = useMemo(() => {
    if (!selected) {
      return null;
    }

    if (selected.toxins.length === 0) {
      return null;
    }

    return selected.toxins.find((toxin) => toxin.slug === selectedChemistryToxinSlug) ?? selected.toxins[0];
  }, [selected, selectedChemistryToxinSlug]);

  const taxonomyRanks = useMemo(
    () => [
      {
        key: 'kingdom',
        latinLabel: 'Regnum',
        englishLabel: 'Kingdom',
        value: selected?.taxonomy.kingdom ?? 'Unknown',
      },
      {
        key: 'phylum',
        latinLabel: 'Phylum',
        englishLabel: 'Phylum',
        value: selected?.taxonomy.phylum ?? 'Unknown',
      },
      {
        key: 'class',
        latinLabel: 'Classis',
        englishLabel: 'Class',
        value: selected?.taxonomy.className ?? 'Unknown',
      },
      {
        key: 'order',
        latinLabel: 'Ordo',
        englishLabel: 'Order',
        value: selected?.taxonomy.order ?? 'Unknown',
      },
      {
        key: 'family',
        latinLabel: 'Familia',
        englishLabel: 'Family',
        value: selected?.taxonomy.family ?? 'Unknown',
      },
      {
        key: 'genus',
        latinLabel: 'Genus',
        englishLabel: 'Genus',
        value: selected?.taxonomy.genus ?? 'Unknown',
      },
      {
        key: 'species',
        latinLabel: 'Species',
        englishLabel: 'Species',
        value: selected?.taxonomy.species ?? 'Unknown',
      },
    ],
    [selected],
  );

  const selectedClassKey = useMemo(
    () => classifyOrganismClass(selected?.taxonomy.className),
    [selected],
  );

  const summarySpeciesLabel = `Organism: ${selected.scientificName} (${selected.commonName})`;
  const summaryOrganismOverview = firstSentence(selected.overview);
  const summaryToxinOverview = selectedChemistryToxin
    ? firstSentence(
        `${selectedChemistryToxin.displayName}${selectedChemistryToxin.family ? ` (${selectedChemistryToxin.family})` : ''}. ${summarizeToxinCategory(selected)}`,
      )
    : summarizeToxinCategory(selected);

  useEffect(() => {
    if (!selected || selected.toxins.length === 0) {
      setSelectedChemistryToxinSlug('');
      return;
    }

    if (!selected.toxins.some((toxin) => toxin.slug === selectedChemistryToxinSlug)) {
      setSelectedChemistryToxinSlug(selected.toxins[0].slug);
    }
  }, [selected, selectedChemistryToxinSlug]);

  useEffect(() => {
    setIsMapInteractive(false);
  }, [selectedOrganismSlug]);

  useEffect(() => {
    if (selectionLocked || !selectedOrganismSlug) {
      return;
    }

    const currentUrl = new URL(window.location.href);
    if (
      currentUrl.searchParams.get('organism') === selectedOrganismSlug &&
      currentUrl.searchParams.get('toxin') === (selectedChemistryToxin?.slug ?? null) &&
      !currentUrl.searchParams.has('unlock')
    ) {
      return;
    }

    currentUrl.searchParams.set('organism', selectedOrganismSlug);
    if (selectedChemistryToxin?.slug) {
      currentUrl.searchParams.set('toxin', selectedChemistryToxin.slug);
    } else {
      currentUrl.searchParams.delete('toxin');
    }
    currentUrl.searchParams.delete('unlock');
    const query = currentUrl.searchParams.toString();
    const href = `${currentUrl.pathname}${query.length > 0 ? `?${query}` : ''}${currentUrl.hash}`;
    window.history.replaceState(null, '', href);
  }, [selectedChemistryToxin?.slug, selectedOrganismSlug, selectionLocked]);

  const moleculeModel = useMemo(() => {
    if (!selected || !selectedChemistryToxin?.structure3dUrl || !selectedChemistryToxin.structure3dFormat) {
      return null;
    }

    return {
      entityId: `${selected.slug}-${selectedChemistryToxin.slug}`,
      displayName: selectedChemistryToxin.displayName,
      molecularClass: selectedChemistryToxin.molecularClass,
      structureFormat: selectedChemistryToxin.structure3dFormat,
      structureUrl: selectedChemistryToxin.structure3dUrl,
      defaultRepresentation: 'ball_and_stick' as MolecularRepresentation,
      supportedRepresentations,
      annotations: [
        {
          id: 'ann-monopage-note',
          label: 'Monopage mode',
          description: 'This interactive view is hydrated on a static Astro page.',
        },
      ],
    };
  }, [selected, selectedChemistryToxin]);

  const complexModel = useMemo(() => {
    if (!selected || !selectedChemistryToxin?.interactionVisualization) {
      return null;
    }

    return {
      entityId: `${selected.slug}-${selectedChemistryToxin.slug}-complex`,
      displayName: `${selectedChemistryToxin.displayName} target complex`,
      molecularClass: 'complex' as const,
      structureFormat: selectedChemistryToxin.interactionVisualization.structureFormat,
      structureUrl: selectedChemistryToxin.interactionVisualization.structureAssetPath,
      defaultRepresentation: 'target_complex' as MolecularRepresentation,
      supportedRepresentations: supportedComplexRepresentations,
      annotations: [
        {
          id: 'ann-complex-evidence',
          label: 'Interaction context',
          description:
            'Rendered from static annotation and structure assets. Biological interactions are not inferred at runtime.',
        },
      ],
    };
  }, [selected, selectedChemistryToxin]);

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
  }, [selectionLocked, selected]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const sectionNodes = Array.from(root.querySelectorAll<HTMLElement>('[data-scroll-section]'));
    if (sectionNodes.length === 0) {
      return;
    }

    sectionNodes[0]?.setAttribute('data-in-focus', 'true');
    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!mostVisible) {
          return;
        }

        for (const sectionNode of sectionNodes) {
          sectionNode.removeAttribute('data-in-focus');
        }

        if (mostVisible.target instanceof HTMLElement) {
          mostVisible.target.setAttribute('data-in-focus', 'true');

          if (!selectionLocked && mostVisible.target.id) {
            const url = new URL(window.location.href);
            if (url.hash !== `#${mostVisible.target.id}`) {
              url.hash = mostVisible.target.id;
              const query = url.searchParams.toString();
              const href = `${url.pathname}${query.length > 0 ? `?${query}` : ''}${url.hash}`;
              window.history.replaceState(null, '', href);
            }
          }
        }
      },
      {
        threshold: [0.2, 0.35, 0.5, 0.65],
        rootMargin: '-8% 0px -35% 0px',
      },
    );

    for (const sectionNode of sectionNodes) {
      observer.observe(sectionNode);
    }

    return () => observer.disconnect();
  }, [selectedOrganismSlug, selectionLocked]);

  useEffect(() => {
    if (selectionLocked) {
      return;
    }

    const targetId = decodeURIComponent(window.location.hash.replace('#', '').trim());
    if (!targetId) {
      return;
    }

    const targetElement = document.getElementById(targetId);
    if (!targetElement) {
      return;
    }

    window.requestAnimationFrame(() => {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (targetElement instanceof HTMLElement) {
        targetElement.focus({ preventScroll: true });
      }
    });
  }, [selectedOrganismSlug, selectionLocked]);

  if (!selected) {
    return <p className="panel">No organisms available for monopage rendering.</p>;
  }

  return (
    <section className={`atlas-monopage-shell${!selectionLocked ? ' has-global-summary' : ''}`}>
      {!selectionLocked ? (
        <aside ref={globalSummaryRef} className="atlas-global-summary-pills" aria-label="Pinned organism summary">
          <section className="atlas-global-summary-strip" role="status" aria-live="polite">
            <p className="atlas-global-summary-line">
              {summarySpeciesLabel}
            </p>
            <p className="atlas-global-summary-line">Overview: {summaryOrganismOverview}</p>
            <p className="atlas-global-summary-line">Toxicology: {summaryToxinOverview}</p>
          </section>
        </aside>
      ) : null}

      <section
        ref={rootRef}
        className={`atlas-monopage${selectionLocked ? ' atlas-monopage-locked' : ''}`}
        aria-hidden={selectionLocked}
      >
        {sections.map((section) => (
          <ScrollSection
            key={section.id}
            id={section.id}
            title={section.title}
            dedicatedHref={sectionHref(section.kind, selected, selectedChemistryToxin?.slug)}
            dedicatedLabel={section.dedicatedLabel}
          >
            {section.kind === 'organism-profile' ? (
              <section className="panel organism-story-shell">
                <section className="grid organism-story">
                  <article className="organism-story-section organism-overview-sticky">
                    <h1>
                      {selected.scientificName} ({selected.commonName})
                    </h1>
                  </article>

                  <section className="organism-story-section">
                    <h2>Species snapshot</h2>
                    <section className="organism-taxonomy-path" aria-label="Taxonomic hierarchy">
                      <div className="organism-taxonomy-matrix" aria-hidden="true">
                        {taxonomyRanks.map((rank) => (
                          <div
                            key={rank.key}
                            className={`organism-taxonomy-rank organism-taxonomy-rank-${rank.key}`}
                          >
                            <span className="organism-taxonomy-rank-label">{rank.latinLabel}</span>
                            <span className="organism-taxonomy-rank-value">{rank.value}</span>
                          </div>
                        ))}
                      </div>
                      <ul className="organism-taxonomy-grid-sr-only">
                        {taxonomyRanks.map((rank) => (
                          <li key={`${rank.key}-sr`}>
                            <strong>{rank.englishLabel}</strong> ({rank.latinLabel}): {rank.value}
                          </li>
                        ))}
                      </ul>
                    </section>

                    <div className="organism-snapshot-layout">
                      <div className="organism-snapshot-text">
                        <h3>Reference summary</h3>
                        {selected.externalProfile ? (
                          <>
                            {selected.externalProfile.summaryPoints.map((point) => (
                              <p key={point}>{point}</p>
                            ))}
                            <p className="muted">Summarized from an external species reference page.</p>
                            <a href={selected.externalProfile.sourceUrl} target="_blank" rel="noreferrer">
                              Open {selected.externalProfile.sourceLabel}
                            </a>
                          </>
                        ) : (
                          <p className="muted">Reference summary not yet configured for this organism.</p>
                        )}
                      </div>

                      <aside className="organism-snapshot-media">
                        <h3>Reference images</h3>
                        {selected.externalProfile && selected.externalProfile.imagePaths.length > 0 ? (
                          <div className="organism-image-strip">
                            {selected.externalProfile.imagePaths.map((imagePath) => (
                              <img key={imagePath} src={imagePath} alt={`${selected.scientificName} reference`} />
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
            ) : null}

            {section.kind === 'geography' ? (
              <>
                <div className="panel">
                  <h3>Range layers</h3>
                  <ul>
                    {selected.geographyRanges.map((range) => (
                      <li key={range.id}>
                        <strong>{range.layerType}:</strong> {range.summary}
                      </li>
                    ))}
                  </ul>
                </div>
                {selected.externalProfile?.antMapsEmbedUrl ? (
                  <section className="panel organism-antmaps-wrap">
                    <h3>Interactive species range map</h3>
                    <p className="muted organism-antmaps-hint">
                      Click the map to interact. Move your cursor out of the map to resume normal page scroll.
                    </p>
                    <div
                      className="organism-antmaps-interaction-layer"
                      onMouseLeave={() => setIsMapInteractive(false)}
                    >
                      <iframe
                        className={`organism-antmaps-embed${
                          isMapInteractive ? ' organism-antmaps-embed-interactive' : ''
                        }`}
                        src={selected.externalProfile.antMapsEmbedUrl}
                        title="AntMaps species distribution explorer"
                        loading="lazy"
                        referrerPolicy="strict-origin-when-cross-origin"
                      />

                      {!isMapInteractive ? (
                        <button
                          type="button"
                          className="organism-antmaps-overlay"
                          onClick={() => setIsMapInteractive(true)}
                          aria-label="Enable AntMaps interaction"
                        >
                          <span className="organism-antmaps-overlay-pill">
                            <span className="organism-antmaps-overlay-title">Click to interact with map</span>
                            <span className="organism-antmaps-overlay-subtitle">
                              Scroll is locked to page until you activate map controls.
                            </span>
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="organism-antmaps-lock-button"
                          onClick={() => setIsMapInteractive(false)}
                        >
                          Lock map
                        </button>
                      )}
                    </div>
                  </section>
                ) : null}
              </>
            ) : null}

            {section.kind === 'mechanisms' ? (
              <>
                <section className="panel">
                  <h1>Delivery mechanism schematics</h1>
                  <p className="muted">
                    Two reusable views for {selected.commonName.toLowerCase()}: ecological interaction flow and
                    human interaction flow.
                  </p>
                </section>
                <section className="grid">
                  <DeliveryMechanismDiagram
                    title="Natural mechanism: ecological interaction"
                    ariaLabel={`Schematic of ${selected.commonName} delivering toxin in ecological interactions`}
                    steps={
                      toFourSteps(selected.deliveryMechanism.sequence) ??
                      fallbackNaturalStepsByRoute[selected.deliveryMechanism.route] ??
                      fallbackNaturalStepsByRoute.unknown
                    }
                  />
                  <DeliveryMechanismDiagram
                    title="Human interaction mechanism: defensive contact"
                    ariaLabel={`Schematic of ${selected.commonName} interaction leading to human exposure`}
                    steps={
                      fallbackHumanStepsByRoute[selected.deliveryMechanism.route] ??
                      fallbackHumanStepsByRoute.unknown
                    }
                  />
                </section>
                {selected.mechanismSteps.length > 0 ? (
                  <VegaChart
                    title="Mechanism pathway timeline"
                    summary="Progression view from molecular exposure to clinical outcomes."
                    spec={buildPhysiologyTimelineSpec(selected.mechanismSteps)}
                  />
                ) : (
                  <p className="panel">No mechanism steps are available for this organism yet.</p>
                )}
              </>
            ) : null}

            {section.kind === 'toxin-categorization' ? (
              <div className="panel">
                <h1>Toxin categorization</h1>
                <p>{selected.venom?.description ?? 'No venom description is currently linked.'}</p>
                <p>
                  <strong>Venom profile:</strong> {selected.venom?.name ?? 'Unavailable'}
                </p>
                <p>
                  <strong>Biological role:</strong>{' '}
                  {selected.venom?.ecologicalRoleSummary ?? 'Not yet classified for this organism.'}
                </p>
                {selected.venom ? <EvidenceBadge evidence={selected.venom.evidence} /> : null}
                <h3>Category coverage</h3>
                <p>
                  <strong>Toxin entities:</strong> {selected.toxins.length}
                </p>
                <p>
                  <strong>Toxin families:</strong>{' '}
                  {Array.from(new Set(selected.toxins.map((toxin) => toxin.family ?? 'Unclassified'))).join(', ')}
                </p>
                <p>
                  <strong>Component categories:</strong>{' '}
                  {Array.from(
                    new Set((selected.venom?.components ?? []).map((component) => component.componentCategory)),
                  ).join(', ') || 'Not yet sourced'}
                </p>
              </div>
            ) : null}

            {section.kind === 'toxin-charts' ? (
              selected.venom && selected.venom.components.length > 0 ? (
                <VegaChart
                  title="Toxin composition overview"
                  summary="Evidence-aware BI charting. Unsourced values are intentionally left unquantified."
                  spec={buildVenomCompositionSpec(selected.venom.components)}
                />
              ) : (
                <p className="panel">No venom component chart data is available for this organism yet.</p>
              )
            ) : null}

            {section.kind === 'chemistry' ? (
              <>
                {selectedChemistryToxin ? (
                  <div className="panel">
                    <h1>{selectedChemistryToxin.displayName}</h1>
                    <section className="chemistry-summary-layout">
                      <div className="chemistry-summary-copy">
                        <label htmlFor="chemistry-toxin-select">Chemical component selector</label>
                        <select
                          id="chemistry-toxin-select"
                          value={selectedChemistryToxin.slug}
                          onChange={(event) => setSelectedChemistryToxinSlug(event.target.value)}
                          disabled={selected.toxins.length === 1}
                        >
                          {selected.toxins.map((toxin) => (
                            <option key={toxin.slug} value={toxin.slug}>
                              {toxin.displayName}
                            </option>
                          ))}
                        </select>
                        <p className="muted">Available toxins in this organism profile: {selected.toxins.length}</p>
                        <EvidenceBadge evidence={selectedChemistryToxin.evidence} />
                        <p>
                          <strong>Molecular class:</strong> {selectedChemistryToxin.molecularClass}
                        </p>
                        <p>
                          <strong>Formula:</strong>{' '}
                          {selectedChemistryToxin.formula
                            ? renderChemicalFormula(selectedChemistryToxin.formula)
                            : 'Data not yet sourced.'}
                        </p>
                        <p>
                          <strong>Molecular weight:</strong>{' '}
                          {selectedChemistryToxin.molecularWeight ?? 'Data not yet sourced.'}
                        </p>
                        <p>
                          <strong>Structure source:</strong>{' '}
                          {selectedChemistryToxin.structureDataSource ?? 'Data not yet sourced.'}
                        </p>
                        <p className="muted">
                          Distinction: molecular identity (entity), molecular geometry (structure file), visual
                          representation (rendering mode), and biological effect (separate mechanism pages).
                        </p>
                      </div>
                      <section className="chemistry-summary-2d" aria-label="2D structure panel">
                        <h3>2D structure panel</h3>
                        {selectedChemistryToxin.structure2dUrl ? (
                          <div className="chemistry-2d-viewport">
                            <img
                              className="chemistry-2d-asset"
                              src={selectedChemistryToxin.structure2dUrl}
                              alt={`2D skeletal structure for ${selectedChemistryToxin.displayName}`}
                            />
                          </div>
                        ) : (
                          <p>2D structure asset is not available for this toxin.</p>
                        )}
                      </section>
                    </section>
                  </div>
                ) : (
                  <p className="panel">No toxin is linked for chemistry preview.</p>
                )}
                <div className="chemistry-render-grid">
                  {moleculeModel ? (
                    <MoleculeViewer model={moleculeModel} />
                  ) : (
                    <p className="panel">No 3D molecular structure asset is available for this toxin.</p>
                  )}
                </div>
                <section className="panel">
                  <h3>Evidence and sources</h3>
                  <CitationList citations={selectedChemistryToxin?.citations ?? []} />
                </section>
                {complexModel && selectedChemistryToxin ? (
                  <StructureComplexViewer
                    model={complexModel}
                    annotationPath={selectedChemistryToxin.interactionVisualization?.annotationPath}
                    fallbackEvidence={selectedChemistryToxin.evidence}
                    citations={selectedChemistryToxin.citations}
                  />
                ) : null}
              </>
            ) : null}

            {section.kind === 'physiology' ? (
              <>
                <h1>Human physiology effects</h1>
                <AnatomySvg highlights={localHighlights} />
                <section className="panel">
                  <h3>Direct versus immune-mediated pathways</h3>
                  <p>
                    <strong>Direct local venom effect:</strong>{' '}
                    {(selected.physiology?.effects ?? [])
                      .filter((entry) => entry.pathwayType === 'direct_venom')
                      .map((entry) => entry.title)
                      .join(', ') || 'Not yet sourced'}
                  </p>
                  <p>
                    <strong>Inflammatory or immune-mediated:</strong>{' '}
                    {(selected.physiology?.effects ?? [])
                      .filter((entry) => entry.pathwayType !== 'direct_venom')
                      .map((entry) => entry.title)
                      .join(', ') || 'Not yet sourced'}
                  </p>
                </section>
                <VegaChart
                  title="Sting progression timeline"
                  summary="Distinguishes direct local effects from inflammatory and separate systemic allergic pathways."
                  spec={buildPhysiologyTimelineSpec(selected.mechanismSteps)}
                  empty={selected.mechanismSteps.length === 0}
                />
              </>
            ) : null}
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
              Framework mode: {classLabel(selectedClassKey)}. {selectionSubtitle(selectedClassKey)}
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
            {sortedOrganisms.length === 0 ? <p className="muted">No organisms match your search.</p> : null}
            {sortedOrganisms.length > 0 ? (
              <div className="atlas-organism-gate-options">
                {sortedOrganisms.map((organism) => (
                  <a
                    key={organism.slug}
                    className={`atlas-organism-option${
                      organism.slug === selectedOrganismSlug ? ' atlas-organism-option-selected' : ''
                    }`}
                    href={`/?organism=${encodeURIComponent(organism.slug)}&unlock=1#section-organism-profile`}
                    onClick={(event) => {
                      event.preventDefault();
                      setSelectedOrganismSlug(organism.slug);
                      setSelectionLocked(false);
                      window.requestAnimationFrame(() => {
                        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
                      });
                    }}
                  >
                    <strong>{organism.scientificName}</strong>
                    <span className="muted">{organism.commonName}</span>
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </section>
  );
};
