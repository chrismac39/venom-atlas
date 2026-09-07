import { useEffect, useMemo, useRef, useState } from 'react';
import type { MolecularRepresentation } from '@venom-atlas/visualization-contracts';
import type { AtlasOrganismData } from '../atlas-types';

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

const firstSentence = (text: string): string => {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return 'Overview not yet sourced.';
  }

  const match = normalized.match(/^.+?[.!?](?:\s|$)/);
  return (match ? match[0] : normalized).trim();
};

const summarizeToxinCategory = (organism: AtlasOrganismData): string => {
  if (!organism.toxicMaterial || organism.toxicMaterial.components.length === 0) {
    return `${organism.toxicStrategy}. Material composition has not yet been curated.`;
  }

  const leadCompound = organism.featuredToxin?.displayName ?? 'mixed compounds';
  const categories = Array.from(
    new Set(
      organism.toxicMaterial.components
        .map((component) => component.componentCategory)
        .filter((category) => category.trim().length > 0),
    ),
  );

  return categories.length > 0
    ? `${organism.toxicStrategy} - ${leadCompound}, including ${categories.slice(0, 2).join(' and ')}.`
    : `${organism.toxicStrategy} - ${leadCompound}.`;
};

export const useAtlasMonopageOrchestration = (organism: AtlasOrganismData) => {
  const rootRef = useRef<HTMLElement | null>(null);
  const globalSummaryRef = useRef<HTMLDivElement | null>(null);
  const [selectedChemistryToxinSlug, setSelectedChemistryToxinSlug] = useState('');

  useEffect(() => {
    const applyStateFromUrl = () => {
      const toxinFromUrl = new URL(window.location.href).searchParams.get('toxin');
      setSelectedChemistryToxinSlug(
        toxinFromUrl && organism.toxins.some((toxin) => toxin.slug === toxinFromUrl) ? toxinFromUrl : '',
      );
    };

    applyStateFromUrl();
    window.addEventListener('popstate', applyStateFromUrl);
    return () => window.removeEventListener('popstate', applyStateFromUrl);
  }, [organism]);

  const selectedChemistryToxin = useMemo(() => {
    if (organism.toxins.length === 0) {
      return null;
    }

    return organism.toxins.find((toxin) => toxin.slug === selectedChemistryToxinSlug) ?? organism.toxins[0];
  }, [organism, selectedChemistryToxinSlug]);

  const availableSectionKinds = useMemo(() => {
    const kinds = new Set<string>(['organism-profile']);
    if (organism.geographyRanges.length > 0 || organism.geographyVisualizations.length > 0) kinds.add('geography');
    if (organism.deliveryMechanism.sequence.length > 0 || organism.mechanismSteps.length > 0) kinds.add('mechanisms');
    if (organism.toxicMaterial) {
      kinds.add('toxin-categorization');
      if (organism.toxicMaterial.components.some((component) => component.abundanceQualifier !== 'not_quantified')) {
        kinds.add('toxin-charts');
      }
    }
    if (organism.toxins.length > 0) kinds.add('chemistry');
    if (organism.physiology || organism.mechanismSteps.length > 0) kinds.add('physiology');
    return kinds;
  }, [organism]);

  const taxonomyRanks = useMemo(
    () => [
      { key: 'kingdom', latinLabel: 'Regnum', englishLabel: 'Kingdom', value: organism.taxonomy.kingdom ?? 'Unknown' },
      { key: 'phylum', latinLabel: 'Phylum', englishLabel: 'Phylum', value: organism.taxonomy.phylum ?? 'Unknown' },
      { key: 'class', latinLabel: 'Classis', englishLabel: 'Class', value: organism.taxonomy.className ?? 'Unknown' },
      { key: 'order', latinLabel: 'Ordo', englishLabel: 'Order', value: organism.taxonomy.order ?? 'Unknown' },
      { key: 'family', latinLabel: 'Familia', englishLabel: 'Family', value: organism.taxonomy.family ?? 'Unknown' },
      { key: 'genus', latinLabel: 'Genus', englishLabel: 'Genus', value: organism.taxonomy.genus ?? 'Unknown' },
      { key: 'species', latinLabel: 'Species', englishLabel: 'Species', value: organism.taxonomy.species ?? 'Unknown' },
    ],
    [organism],
  );

  const summarySpeciesLabel = `Organism: ${organism.scientificName} (${organism.commonName})`;
  const summaryOrganismOverview = firstSentence(organism.overview);
  const summaryToxinOverview = selectedChemistryToxin
    ? firstSentence(
        `${selectedChemistryToxin.displayName}${selectedChemistryToxin.family ? ` (${selectedChemistryToxin.family})` : ''}. ${summarizeToxinCategory(organism)}`,
      )
    : summarizeToxinCategory(organism);

  useEffect(() => {
    if (
      selectedChemistryToxinSlug &&
      !organism.toxins.some((toxin) => toxin.slug === selectedChemistryToxinSlug)
    ) {
      setSelectedChemistryToxinSlug('');
    }
  }, [organism, selectedChemistryToxinSlug]);

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const nextToxinSlug = selectedChemistryToxinSlug || null;
    if (currentUrl.searchParams.get('toxin') === nextToxinSlug) {
      return;
    }

    if (nextToxinSlug) currentUrl.searchParams.set('toxin', nextToxinSlug);
    else currentUrl.searchParams.delete('toxin');
    const query = currentUrl.searchParams.toString();
    window.history.replaceState(null, '', `${currentUrl.pathname}${query ? `?${query}` : ''}${currentUrl.hash}`);
  }, [selectedChemistryToxinSlug]);

  const moleculeModel = useMemo(() => {
    if (!selectedChemistryToxin?.structure3dUrl || !selectedChemistryToxin.structure3dFormat) return null;
    return {
      entityId: `${organism.slug}-${selectedChemistryToxin.slug}`,
      displayName: selectedChemistryToxin.displayName,
      molecularClass: selectedChemistryToxin.molecularClass,
      structureFormat: selectedChemistryToxin.structure3dFormat,
      structureUrl: selectedChemistryToxin.structure3dUrl,
      defaultRepresentation: 'ball_and_stick' as MolecularRepresentation,
      supportedRepresentations,
      annotations: [{ id: 'ann-monopage-note', label: 'Atlas view', description: 'Interactive molecular structure.' }],
    };
  }, [organism.slug, selectedChemistryToxin]);

  const complexModel = useMemo(() => {
    if (!selectedChemistryToxin?.interactionVisualization) return null;
    return {
      entityId: `${organism.slug}-${selectedChemistryToxin.slug}-complex`,
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
          description: 'Rendered from static annotations; biological interactions are not inferred at runtime.',
        },
      ],
    };
  }, [organism.slug, selectedChemistryToxin]);

  useEffect(() => {
    const summaryElement = globalSummaryRef.current;
    if (!summaryElement) return;

    const setSummaryHeight = () => {
      document.documentElement.style.setProperty(
        '--global-summary-height',
        `${Math.ceil(summaryElement.getBoundingClientRect().height)}px`,
      );
    };
    setSummaryHeight();
    const observer = new ResizeObserver(setSummaryHeight);
    observer.observe(summaryElement);
    window.addEventListener('resize', setSummaryHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', setSummaryHeight);
      document.documentElement.style.setProperty('--global-summary-height', '0px');
    };
  }, [organism]);

  useEffect(() => {
    const sectionNodes = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[data-scroll-section]') ?? []);
    if (sectionNodes.length === 0) return;

    sectionNodes[0]?.setAttribute('data-in-focus', 'true');
    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!(mostVisible?.target instanceof HTMLElement)) return;

        sectionNodes.forEach((sectionNode) => sectionNode.removeAttribute('data-in-focus'));
        mostVisible.target.setAttribute('data-in-focus', 'true');
        if (mostVisible.target.id && window.location.hash !== `#${mostVisible.target.id}`) {
          const url = new URL(window.location.href);
          url.hash = mostVisible.target.id;
          window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
        }
      },
      { threshold: [0.2, 0.35, 0.5, 0.65], rootMargin: '-8% 0px -35% 0px' },
    );
    sectionNodes.forEach((sectionNode) => observer.observe(sectionNode));
    return () => observer.disconnect();
  }, [organism.slug]);

  useEffect(() => {
    const targetId = decodeURIComponent(window.location.hash.replace('#', '').trim());
    const targetElement = targetId ? document.getElementById(targetId) : null;
    if (!targetElement) return;

    window.requestAnimationFrame(() => {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      targetElement.focus({ preventScroll: true });
    });
  }, [organism.slug]);

  return {
    availableSectionKinds,
    complexModel,
    globalSummaryRef,
    moleculeModel,
    rootRef,
    selectedChemistryToxin,
    setSelectedChemistryToxinSlug,
    summaryOrganismOverview,
    summarySpeciesLabel,
    summaryToxinOverview,
    taxonomyRanks,
  };
};