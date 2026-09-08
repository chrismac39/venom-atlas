import { useMemo, useState } from 'react';
import type { AtlasOrganismData } from '../../atlas/atlas-types';
import { toxicStrategyLabel } from '../../../lib/organism-labels';
import type {
  CatalogFacets,
  CatalogFilters,
  CatalogFacetOption,
  OrganismCatalogModel,
} from '../catalog-types';

const normalize = (value: string): string => value.trim().toLocaleLowerCase();

const facetOptions = (values: string[], labelFor: (value: string) => string): CatalogFacetOption[] => {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, label: labelFor(value), count }))
    .sort((left, right) => left.label.localeCompare(right.label));
};

const searchableText = (organism: AtlasOrganismData): string => [
  organism.slug,
  organism.scientificName,
  organism.commonName,
  organism.taxonomy.kingdom,
  organism.taxonomy.phylum,
  organism.taxonomy.className,
  organism.taxonomy.order,
  organism.taxonomy.family,
  organism.taxonomy.genus,
  organism.taxonomy.species,
  organism.toxicStrategy,
  organism.toxicMaterial?.name,
  organism.toxicMaterial?.materialKind,
  ...organism.toxins.flatMap((toxin) => [toxin.displayName, toxin.family]),
].filter((value): value is string => Boolean(value)).join(' ');

export const filterOrganisms = (organisms: AtlasOrganismData[], filters: CatalogFilters): AtlasOrganismData[] => {
  const query = normalize(filters.query);
  return organisms.filter((organism) => {
    const matchesQuery = query.length === 0 || normalize(searchableText(organism)).includes(query);
    const matchesKingdom = filters.kingdom.length === 0 || organism.taxonomy.kingdom === filters.kingdom;
    const matchesStrategy = filters.toxicStrategy.length === 0 || organism.toxicStrategy === filters.toxicStrategy;
    return matchesQuery && matchesKingdom && matchesStrategy;
  });
};

const buildFacets = (organisms: AtlasOrganismData[]): CatalogFacets => {
  const modules = organisms.flatMap((organism) =>
    Object.entries(organism.coverage)
      .filter(([, status]) => status === 'available')
      .map(([module]) => module),
  );

  return {
    kingdoms: facetOptions(
      organisms.map((organism) => organism.taxonomy.kingdom).filter((value): value is string => Boolean(value)),
      (value) => value,
    ),
    toxicStrategies: facetOptions(
      organisms.map((organism) => organism.toxicStrategy),
      (value) => toxicStrategyLabel(value as AtlasOrganismData['toxicStrategy']),
    ),
    materialKinds: facetOptions(
      organisms
        .map((organism) => organism.toxicMaterial?.materialKind)
        .filter((value) => value !== undefined),
      (value) => value.replaceAll('_', ' '),
    ),
    modules: facetOptions(modules, (value) => value.replaceAll(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase())),
  };
};

export const useOrganismCatalogOrchestration = (organisms: AtlasOrganismData[]): OrganismCatalogModel & {
  setQuery: (query: string) => void;
  setKingdom: (kingdom: string) => void;
  setToxicStrategy: (strategy: CatalogFilters['toxicStrategy']) => void;
  clearFilters: () => void;
} => {
  const [filters, setFilters] = useState<CatalogFilters>({ query: '', kingdom: '', toxicStrategy: '' });
  const facets = useMemo(() => buildFacets(organisms), [organisms]);
  const results = useMemo(
    () => filterOrganisms(organisms, filters).sort((left, right) => left.scientificName.localeCompare(right.scientificName)),
    [filters, organisms],
  );

  return {
    filters,
    facets,
    results,
    total: organisms.length,
    setQuery: (query) => setFilters((current) => ({ ...current, query })),
    setKingdom: (kingdom) => setFilters((current) => ({ ...current, kingdom })),
    setToxicStrategy: (toxicStrategy) => setFilters((current) => ({ ...current, toxicStrategy })),
    clearFilters: () => setFilters({ query: '', kingdom: '', toxicStrategy: '' }),
  };
};
