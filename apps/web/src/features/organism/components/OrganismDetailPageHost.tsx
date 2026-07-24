import { RouteEntityNotFound } from '../../../components/RouteEntityNotFound';
import { defaultOrganismSlug } from '../../../services/atlasRouting';
import type { OrganismDetailPageOrchestration } from '../hooks/useOrganismDetailPageOrchestration';

type OrganismDetailPageHostProps = {
  orchestration: OrganismDetailPageOrchestration;
};

const OrganismDetailPageHost = ({ orchestration }: OrganismDetailPageHostProps) => {
  const {
    organismSlug,
    unknownSlug,
    loadError,
    isLoading,
    showInlineSummary,
    showOverviewLine,
    viewModel,
  } = orchestration;

  if (unknownSlug) {
    return (
      <RouteEntityNotFound
        title="Organism not found"
        message={`No organism is mapped to slug "${organismSlug}".`}
        fallbackHref={`/organisms/${defaultOrganismSlug}`}
        fallbackLabel="Open Solenopsis invicta"
      />
    );
  }

  if (loadError) {
    return <section className="panel">{loadError}</section>;
  }

  if (isLoading || !viewModel) {
    return <section className="panel">Loading organism...</section>;
  }

  return (
    <section className="panel organism-story-shell">
      <section className="grid organism-story">
        <article className="organism-story-section organism-overview-sticky">
          <h1>
            {viewModel.organismScientificName} ({viewModel.organismCommonName})
          </h1>
          {showOverviewLine ? <p>{viewModel.organismOverview}</p> : null}
          {showInlineSummary ? (
            <div className="organism-summary-details">
              <section className="organism-summary-pill">
                <h3>Toxin category</h3>
                <p>{viewModel.toxinCategorySummary}</p>
              </section>
              <section className="organism-summary-pill">
                <h3>Exposure to humans</h3>
                <p>{viewModel.humanExposureSummary}</p>
              </section>
            </div>
          ) : null}
        </article>

        <section className="organism-story-section">
          <h2>Species snapshot</h2>
          <section className="organism-taxonomy-path" aria-label="Taxonomic hierarchy">
            <div className="organism-taxonomy-matrix" aria-hidden="true">
              {viewModel.taxonomyRanks.map((rank) => (
                <div className={`organism-taxonomy-rank organism-taxonomy-rank-${rank.key}`} key={rank.key}>
                  <span className="organism-taxonomy-rank-label">{rank.latinLabel}</span>
                  <span className="organism-taxonomy-rank-value">{rank.value}</span>
                </div>
              ))}
            </div>
            <ul className="organism-taxonomy-grid-sr-only">
              {viewModel.taxonomyRanks.map((rank) => (
                <li key={rank.key}>
                  <strong>{rank.englishLabel}</strong> ({rank.latinLabel}): {rank.value}
                </li>
              ))}
            </ul>
          </section>
          <div className="organism-snapshot-layout">
            <div className="organism-snapshot-text">
              <h3>Reference summary</h3>
              {viewModel.externalProfile ? (
                <>
                  {viewModel.externalProfile.summaryPoints.map((point) => (
                    <p key={point}>{point}</p>
                  ))}
                  <p className="muted">Summarized from an external species reference page.</p>
                  <a href={viewModel.externalProfile.sourceUrl} target="_blank" rel="noreferrer">
                    Open {viewModel.externalProfile.sourceLabel}
                  </a>
                </>
              ) : (
                <p className="muted">Reference summary not yet configured for this organism.</p>
              )}
            </div>
            <aside className="organism-snapshot-media">
              <h3>Reference images</h3>
              {viewModel.externalProfile && viewModel.externalProfile.imageUrls.length > 0 ? (
                <div className="organism-image-strip">
                  {viewModel.externalProfile.imageUrls.map((imageUrl) => (
                    <img
                      src={imageUrl}
                      alt={`${viewModel.organismScientificName} reference`}
                      key={imageUrl}
                    />
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
  );
};

export default OrganismDetailPageHost;
