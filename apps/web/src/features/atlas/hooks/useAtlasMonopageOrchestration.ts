import { useEffect, useMemo, useRef, useState } from 'react';
import type { MolecularRepresentation } from '@venom-atlas/visualization-contracts';
import { atlasSections, type AtlasOrganismData, type AtlasSectionId } from '../atlas-types';

export const atlasLegacyBookmarks: Record<string, AtlasSectionId> = {
  'section-organism-profile': 'section-summary',
  'section-mechanisms': 'section-medical-effects',
  'section-toxin-categorization': 'section-chemistry',
  'section-toxin-charts': 'section-chemistry',
  'section-human-physiology': 'section-medical-effects',
};

export const canonicalAtlasSectionId = (hash: string): AtlasSectionId | null => {
  let id: string;
  try {
    id = decodeURIComponent(hash.replace(/^#/, ''));
  } catch {
    return null;
  }
  if (!id.startsWith('section-')) id = `section-${id}`;
  return atlasSections.find((section) => section.id === id)?.id ?? atlasLegacyBookmarks[id] ?? null;
};

const supportedRepresentations: MolecularRepresentation[] = [
  'ball_and_stick',
  'stick',
  'space_filling',
  'molecular_surface',
];

const supportedComplexRepresentations: MolecularRepresentation[] = [
  'target_complex',
  'cartoon',
  'stick',
  'space_filling',
  'molecular_surface',
];

export const useAtlasMonopageOrchestration = (organism: AtlasOrganismData) => {
  const rootRef = useRef<HTMLElement | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<AtlasSectionId>('section-summary');
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

    return organism.toxins.find((toxin) => toxin.slug === selectedChemistryToxinSlug)
      ?? organism.toxins.find((toxin) => toxin.slug === organism.featuredToxin?.slug)
      ?? organism.toxins[0] ?? null;
  }, [organism, selectedChemistryToxinSlug]);

  const chemistryMechanismSteps = useMemo(() => [
    ...organism.mechanismSteps.filter((step) => step.level === 'molecular'),
    ...(selectedChemistryToxin?.mechanismSteps ?? []),
  ], [organism, selectedChemistryToxin]);
  const medicalMechanismSteps = useMemo(() =>
    organism.mechanismSteps.filter((step) => step.level !== 'molecular'), [organism]);
  const medicalEffects = useMemo(() =>
    [...(organism.physiology?.effects ?? [])].sort((a, b) => a.order - b.order), [organism]);

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

  const selectChemistryToxin = (slug: string) => {
    if (!organism.toxins.some((toxin) => toxin.slug === slug)) return;
    setSelectedChemistryToxinSlug(slug);
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('toxin', slug);
    window.history.replaceState(window.history.state, '', `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
  };

  const moleculeModel = useMemo(() => {
    if (!selectedChemistryToxin?.structure3dUrl || !selectedChemistryToxin.structure3dFormat) return null;
    return {
      entityId: `${organism.slug}-${selectedChemistryToxin.slug}`,
      displayName: selectedChemistryToxin.displayName,
      molecularClass: selectedChemistryToxin.molecularClass,
      structureFormat: selectedChemistryToxin.structure3dFormat,
      structureUrl: selectedChemistryToxin.structure3dUrl,
      structure2dUrl: selectedChemistryToxin.structure2dUrl,
      defaultRepresentation: 'ball_and_stick' as MolecularRepresentation,
      supportedRepresentations,
      annotations: [{ id: 'ann-monopage-note', label: 'Atlas view', description: 'Interactive molecular structure.' }],
    };
  }, [organism.slug, selectedChemistryToxin]);

  const complexModel = useMemo(() => {
    // Fictional UI demonstrations do not belong in a scientific dossier.
    if (!selectedChemistryToxin?.interactionVisualization || selectedChemistryToxin.interactionVisualization.evidence.level === 'illustrative') return null;
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
    const sectionNodes = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[data-scroll-section]') ?? []);
    if (sectionNodes.length === 0 || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!(mostVisible?.target instanceof HTMLElement)) return;

        const id = canonicalAtlasSectionId(mostVisible.target.id);
        if (id) setActiveSectionId(id);
      },
      { threshold: [0.2, 0.35, 0.5, 0.65], rootMargin: '-8% 0px -35% 0px' },
    );
    sectionNodes.forEach((sectionNode) => observer.observe(sectionNode));
    return () => observer.disconnect();
  }, [organism.slug]);

  useEffect(() => {
    let frame: number | undefined;
    const navigateToBookmark = () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      const id = canonicalAtlasSectionId(window.location.hash);
      const target = id ? rootRef.current?.querySelector<HTMLElement>(`#${id}`) : null;
      if (!id || !target) return;
      setActiveSectionId(id);
      // Old composition/chart links land on the sourced material list, not a removed widget.
      if (/toxin-(categorization|charts)$/.test(window.location.hash)) {
        const material = target.querySelector<HTMLDetailsElement>('#chemistry-material');
        if (material) material.open = true;
      }
      const url = new URL(window.location.href);
      url.hash = id;
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
      frame = window.requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: 'instant', block: 'start' });
        target.focus({ preventScroll: true });
      });
    };
    navigateToBookmark();
    window.addEventListener('hashchange', navigateToBookmark);
    window.addEventListener('popstate', navigateToBookmark);
    return () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      window.removeEventListener('hashchange', navigateToBookmark);
      window.removeEventListener('popstate', navigateToBookmark);
    };
  }, [organism.slug]);

  return {
    organism,
    sections: atlasSections,
    activeSectionId,
    chemistryMechanismSteps,
    medicalMechanismSteps,
    medicalEffects,
    complexModel,
    moleculeModel,
    rootRef,
    selectedChemistryToxin,
    selectChemistryToxin,
    taxonomyRanks,
  };
};

export type AtlasMonopageViewModel = ReturnType<typeof useAtlasMonopageOrchestration>;