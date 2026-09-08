import type { AtlasOrganismData } from '../../src/features/atlas/atlas-types';
import type { ContentRecords } from '../../src/lib/content';

/** Identity-only catalog inputs for filter tests, not a publication/eligibility bypass. */
export const rawCatalogEntries = (content: ContentRecords): AtlasOrganismData[] => content.organisms.map((record) => ({
  slug: record.slug, scientificName: record.scientificName, commonName: record.commonName, toxicStrategy: record.toxicStrategy,
  overview: record.overview, naturalHistory: record.naturalHistory,
  taxonomy: Object.fromEntries(Object.entries(record.taxonomy).filter((entry): entry is [string, string] => typeof entry[1] === 'string')),
  provenance: { evidence: record.evidence, citations: [] },
  deliveryMechanism: { ...record.deliveryMechanism, provenance: { evidence: record.evidence, citations: [] } },
  geographyVisualizations: [], habitats: [], ecologicalRoles: [], geographyRanges: [], geographySourceAudit: null,
  geographyKind: 'terrestrial', toxicMaterial: null, toxins: [], featuredToxin: null, mechanismSteps: [], physiology: null, citations: [],
  coverage: { identity: 'available', geography: 'missing', toxicMaterial: 'missing', chemistry: 'missing', structures: 'missing', physiology: 'missing', media: 'missing' },
}));