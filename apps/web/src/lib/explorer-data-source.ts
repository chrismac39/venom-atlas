export interface OrganismFilters {
  anatomicalSystemId?: string;
  toxinFamily?: string;
  rangeLayer?: string;
}

export interface ToxinFilters {
  targetType?: string;
  molecularClass?: string;
}

export interface OrganismSearchResult {
  id: string;
  slug: string;
  scientificName: string;
  commonName: string;
}

export interface ToxinSearchResult {
  id: string;
  slug: string;
  displayName: string;
  family?: string;
}

export interface RelatedEntity {
  id: string;
  entityType: 'organism' | 'venom' | 'toxin' | 'mechanism' | 'effect';
  title: string;
  route: string;
}

export interface AtlasExplorerDataSource {
  searchOrganisms(filters: OrganismFilters): Promise<OrganismSearchResult[]>;
  searchToxins(filters: ToxinFilters): Promise<ToxinSearchResult[]>;
  findRelatedEntities(entityId: string): Promise<RelatedEntity[]>;
}
