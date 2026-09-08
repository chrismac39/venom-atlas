import type { AtlasOrganismData } from '../../atlas/atlas-types';
import { appPath } from '../../../lib/paths';
import { toxicStrategyLabel } from '../../../lib/organism-labels';
import type { CatalogFacets, CatalogFilters } from '../catalog-types';

interface Props {
  filters: CatalogFilters;
  facets: CatalogFacets;
  results: AtlasOrganismData[];
  total: number;
  setQuery: (query: string) => void;
  setKingdom: (kingdom: string) => void;
  setToxicStrategy: (strategy: CatalogFilters['toxicStrategy']) => void;
  clearFilters: () => void;
}

const availableModules = (organism: AtlasOrganismData): string[] =>
  Object.entries(organism.coverage)
    .filter(([, status]) => status === 'available')
    .map(([module]) => module);

export const OrganismCatalogHost = ({
  filters,
  facets,
  results,
  total,
  setQuery,
  setKingdom,
  setToxicStrategy,
  clearFilters,
}: Props) => (
  <section className="catalog-shell" aria-labelledby="organism-catalog-title">
    <header className="catalog-header">
      <div>
        <p className="catalog-kicker">Evidence-indexed catalog</p>
        <h1 id="organism-catalog-title">Organisms</h1>
        <p>Search across names, taxonomy, toxic material, and documented toxin entities.</p>
      </div>
      <span className="catalog-count" aria-live="polite">
        {results.length} of {total} organisms
      </span>
    </header>

    <div className="catalog-controls" aria-label="Organism catalog filters">
      <label className="catalog-search">
        Search
        <input
          type="search"
          value={filters.query}
          onInput={(event) => setQuery(event.currentTarget.value)}
          placeholder="Scientific name, family, toxin..."
        />
      </label>
      <label>
        Kingdom
        <select value={filters.kingdom} onChange={(event) => setKingdom(event.target.value)}>
          <option value="">All kingdoms</option>
          {facets.kingdoms.map((option) => (
            <option key={option.value} value={option.value}>{option.label} ({option.count})</option>
          ))}
        </select>
      </label>
      <label>
        Strategy
        <select value={filters.toxicStrategy} onChange={(event) => setToxicStrategy(event.target.value as CatalogFilters['toxicStrategy'])}>
          <option value="">All strategies</option>
          {facets.toxicStrategies.map((option) => (
            <option key={option.value} value={option.value}>{option.label} ({option.count})</option>
          ))}
        </select>
      </label>
      <button type="button" className="catalog-clear" onClick={clearFilters} disabled={!filters.query && !filters.kingdom && !filters.toxicStrategy}>
        Clear filters
      </button>
    </div>

    <div className="catalog-facet-summary" aria-label="Catalog coverage facets">
      <span>Materials: {facets.materialKinds.reduce((sum, option) => sum + option.count, 0)}</span>
      {facets.modules.map((option) => <span key={option.value}>{option.label}: {option.count}</span>)}
    </div>

    {results.length > 0 ? (
      <ul className="catalog-grid">
        {results.map((organism) => (
          <li key={organism.slug} className="catalog-card">
            <div className="catalog-card-heading">
              <div>
                <h2><a href={appPath(`/atlas/${organism.slug}`)}>{organism.commonName}</a></h2>
                <p><i>{organism.scientificName}</i></p>
              </div>
              <span className="catalog-strategy">{toxicStrategyLabel(organism.toxicStrategy)}</span>
            </div>
            <p className="catalog-card-summary">{organism.overview}</p>
            <dl className="catalog-card-facts">
              <div><dt>Kingdom</dt><dd>{organism.taxonomy.kingdom ?? 'Unclassified'}</dd></div>
              <div><dt>Family</dt><dd>{organism.taxonomy.family ?? 'Unclassified'}</dd></div>
              <div><dt>Material</dt><dd>{organism.toxicMaterial?.materialKind?.replaceAll('_', ' ') ?? 'Not documented'}</dd></div>
              <div><dt>Modules</dt><dd>{availableModules(organism).length} available</dd></div>
            </dl>
          </li>
        ))}
      </ul>
    ) : (
      <div className="catalog-empty" role="status">
        <h2>No organisms match these filters</h2>
        <p>Try a broader search or clear one of the selected facets.</p>
      </div>
    )}
  </section>
);
