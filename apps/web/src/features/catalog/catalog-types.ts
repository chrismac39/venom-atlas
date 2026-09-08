import type { AtlasOrganismData } from '../atlas/atlas-types';

export type CatalogFilterKey = 'kingdom' | 'toxicStrategy';

export interface CatalogFilters {
  query: string;
  kingdom: string;
  toxicStrategy: AtlasOrganismData['toxicStrategy'] | '';
}

export interface CatalogFacetOption {
  value: string;
  label: string;
  count: number;
}

export interface CatalogFacets {
  kingdoms: CatalogFacetOption[];
  toxicStrategies: CatalogFacetOption[];
  materialKinds: CatalogFacetOption[];
  modules: CatalogFacetOption[];
}

export interface OrganismCatalogModel {
  filters: CatalogFilters;
  facets: CatalogFacets;
  results: AtlasOrganismData[];
  total: number;
}
