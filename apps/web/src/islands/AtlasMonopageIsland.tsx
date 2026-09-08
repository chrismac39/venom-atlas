import { lazy, Suspense, type ReactNode } from 'react';
import type { AnatomyHighlight } from '@venom-atlas/visualization-contracts';
import { CitationList } from '../components/CitationList';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { appPath } from '../lib/paths';
import type { AtlasOrganismData } from '../features/atlas/atlas-types';
import { exposureRouteLabel, toxicStrategyLabel } from '../lib/organism-labels';
import { DeferredContent } from '../features/atlas/components/DeferredContent';
import { ExternalMapEmbed } from '../features/atlas/components/ExternalMapEmbed';
import { VisualizationErrorBoundary } from '../features/atlas/components/VisualizationErrorBoundary';
import { useAtlasMonopageOrchestration } from '../features/atlas/hooks/useAtlasMonopageOrchestration';
import { AnatomySvg } from '../visualizations/svg/AnatomySvg';
import { DeliveryMechanismDiagram } from '../visualizations/svg/DeliveryMechanismDiagram';
import { RangeMapPanel } from '../visualizations/maps/RangeMapPanel';
import { buildVenomCompositionSpec } from '../visualizations/vega/venomCompositionSpec';

const MoleculeViewer = lazy(() =>
  import('../molecular/components/MoleculeViewer').then((module) => ({ default: module.MoleculeViewer })),
);
const StructureComplexViewer = lazy(() =>
  import('../molecular/components/StructureComplexViewer').then((module) => ({
    default: module.StructureComplexViewer,
  })),
);
const VegaChart = lazy(() =>
  import('../visualizations/vega/VegaChart').then((module) => ({ default: module.VegaChart })),
);

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

const buildAnatomyHighlights = (organism: AtlasOrganismData): AnatomyHighlight[] => {
  if (!organism.physiology) return [];

  const systemById = new Map(organism.physiology.anatomicalSystems.map((system) => [system.id, system]));
  return organism.physiology.effects.flatMap((effect) => {
    const system = systemById.get(effect.anatomicalSystemId);
    if (!system) return [];

    const intensity: AnatomyHighlight['intensity'] =
      effect.pathwayType === 'direct_venom' || effect.pathwayType === 'direct_toxin'
        ? 'primary'
        : effect.pathwayType === 'inflammatory_immune'
          ? 'secondary'
          : 'context';
    return [{
      systemId: system.id,
      intensity,
      label: system.name,
      explanation: system.description,
    }];
  });
};

const toFourSteps = (steps: string[]): [string, string, string, string] | null => {
  const normalized = steps.map((step) => step.trim()).filter((step) => step.length > 0);
  const [first, second, third, fourth] = normalized;
  if (!first || !second || !third || !fourth) {
    return null;
  }
  return [first, second, third, fourth];
};

const coverageLabels: Record<keyof AtlasOrganismData['coverage'], string> = {
  identity: 'Identity',
  geography: 'Geography',
  toxicMaterial: 'Toxic material',
  chemistry: 'Chemistry',
  structures: 'Structures',
  physiology: 'Physiology',
  media: 'Licensed media',
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

const sectionHref = (
  sectionKind: AtlasSectionKind,
  selected: AtlasOrganismData,
  selectedToxinSlug?: string,
): string => {
  const toxinSlug = selectedToxinSlug ?? selected.featuredToxin?.slug;

  if (sectionKind === 'organism-profile') {
    return `/organisms/${selected.slug}`;
  }
  if (sectionKind === 'geography') {
    return `/organisms/${selected.slug}/geography`;
  }
  if (sectionKind === 'toxin-categorization' || sectionKind === 'toxin-charts') {
    return `/organisms/${selected.slug}/toxic-material`;
  }
  if (sectionKind === 'mechanisms') {
    return `/atlas/${selected.slug}#section-mechanisms`;
  }
  if (sectionKind === 'chemistry') {
    return toxinSlug ? `/toxins/${toxinSlug}` : '/toxins';
  }
  return `/atlas/${selected.slug}#section-human-physiology`;
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

export const AtlasMonopageIsland = ({ organism: selected }: { organism: AtlasOrganismData }) => {
  const {
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
  } = useAtlasMonopageOrchestration(selected);
  const availableSections = sections.filter((section) => availableSectionKinds.has(section.kind));
  const anatomyHighlights = buildAnatomyHighlights(selected);

  return (
    <section className="atlas-monopage-shell has-global-summary">
      <aside ref={globalSummaryRef} className="atlas-global-summary-pills" aria-label="Current organism">
          <section className="atlas-global-summary-strip">
            <div className="atlas-global-summary-copy">
            <p className="atlas-global-summary-line atlas-global-summary-species">
              {summarySpeciesLabel}
            </p>
            <p className="atlas-global-summary-line atlas-global-summary-overview">Overview: {summaryOrganismOverview}</p>
            <p className="atlas-global-summary-line atlas-global-summary-toxicology">Toxicology: {summaryToxinOverview}</p>
            </div>
            <a className="atlas-change-organism" href={appPath('/')}>Change organism</a>
          </section>
      </aside>

      <section ref={rootRef} className="atlas-monopage">
        <header className="atlas-organism-hero">
          <div className="atlas-organism-hero-copy">
            <p className="atlas-section-eyebrow">Species dossier</p>
            <h1><i>{selected.scientificName}</i></h1>
            <p className="atlas-organism-common-name">{selected.commonName}</p>
            <p className="atlas-organism-strategy">
              {selected.taxonomy.className ?? 'Unclassified'} · {toxicStrategyLabel(selected.toxicStrategy)}
            </p>
            <p className="atlas-organism-lede">{selected.overview}</p>
          </div>
          <div className="atlas-specimen-mark atlas-specimen-mark-hero" aria-hidden="true">
            <span>{selected.taxonomy.genus?.slice(0, 1)}</span>
            <span>{selected.taxonomy.species?.split(' ')[1]?.slice(0, 1)}</span>
            <small>{selected.taxonomy.family}</small>
          </div>
        </header>

        <nav className="atlas-section-nav" aria-label="Organism sections">
          {availableSections.map((section) => (
            <a key={section.id} href={`#${section.id}`}>{section.title}</a>
          ))}
        </nav>

        {availableSections.map((section) => (
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
                    <h3>At a glance</h3>
                  </article>

                  <section className="organism-story-section">
                    <h2>Species snapshot</h2>
                    <section className="atlas-coverage" aria-labelledby="atlas-coverage-title">
                      <div>
                        <h3 id="atlas-coverage-title">Dossier coverage</h3>
                        <p>Unavailable modules are omitted until source-backed records are curated.</p>
                      </div>
                      <ul>
                        {Object.entries(selected.coverage).map(([key, status]) => (
                          <li key={key} className={`atlas-coverage-${status}`}>
                            <span>{coverageLabels[key as keyof AtlasOrganismData['coverage']]}</span>
                            <strong>{status === 'available' ? 'Available' : 'Not available'}</strong>
                          </li>
                        ))}
                      </ul>
                    </section>
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

                    </div>

                  </section>
                </section>
              </section>
            ) : null}

            {section.kind === 'geography' ? (
              <>
                <RangeMapPanel
                  ranges={selected.geographyRanges}
                  speciesId={selected.slug}
                  geographyKind={selected.geographyKind}
                />
                {selected.geographyVisualizations.map((visualization) => (
                  <ExternalMapEmbed key={visualization.id} visualization={visualization} />
                ))}
              </>
            ) : null}

            {section.kind === 'mechanisms' ? (
              <>
                <section className="panel">
                  <p className="atlas-section-eyebrow">Organism exposure</p>
                  <h3>How exposure occurs</h3>
                  <p>{selected.deliveryMechanism.summary}</p>
                </section>
                {toFourSteps(selected.deliveryMechanism.sequence) ? (
                  <DeliveryMechanismDiagram
                    title="Observed delivery sequence"
                    ariaLabel={`Sourced schematic of ${selected.commonName} toxic exposure`}
                    steps={toFourSteps(selected.deliveryMechanism.sequence) as [string, string, string, string]}
                  />
                ) : null}
                <ol className="atlas-evidence-sequence">
                  {selected.mechanismSteps.map((step) => (
                    <li key={step.id}>
                      <div>
                        <span className="atlas-effect-scope">{step.level.replace('_', ' ')}</span>
                        <h3>{step.title}</h3>
                        <p>{step.description}</p>
                      </div>
                      <EvidenceBadge evidence={step.evidence} />
                    </li>
                  ))}
                </ol>
              </>
            ) : null}

            {section.kind === 'toxin-categorization' ? (
              <div className="panel">
                <h3>Toxin categorization</h3>
                <p>{selected.toxicMaterial?.description ?? 'No toxic-material description is currently linked.'}</p>
                <p>
                  <strong>Toxic material profile:</strong> {selected.toxicMaterial?.name ?? 'Unavailable'}
                </p>
                <h3>Known mixture components</h3>
                <ul className="atlas-component-list">
                  {(selected.toxicMaterial?.components ?? []).map((component) => (
                    <li key={component.id}>
                      <div>
                        <strong>{component.componentCategory}</strong>
                        <p>{component.summary ?? 'No sourced summary is available.'}</p>
                      </div>
                      <EvidenceBadge evidence={component.evidence} />
                    </li>
                  ))}
                </ul>
                <p>
                  <strong>Biological role:</strong>{' '}
                  {selected.toxicMaterial?.ecologicalRoleSummary ?? 'Not yet classified for this organism.'}
                </p>
                {selected.toxicMaterial ? <EvidenceBadge evidence={selected.toxicMaterial.evidence} /> : null}
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
                    new Set(
                      (selected.toxicMaterial?.components ?? []).map((component) => component.componentCategory),
                    ),
                  ).join(', ') || 'Not yet sourced'}
                </p>
              </div>
            ) : null}

            {section.kind === 'toxin-charts' ? (
              selected.toxicMaterial && selected.toxicMaterial.components.length > 0 ? (
                <DeferredContent label="Toxin composition visualization">
                  <VisualizationErrorBoundary fallback="The composition visualization could not be displayed.">
                    <Suspense fallback={<p className="panel">Loading composition visualization...</p>}>
                      <VegaChart
                        title="Toxin composition overview"
                        summary="Evidence-aware composition chart. Unsourced values remain unquantified."
                        spec={buildVenomCompositionSpec(selected.toxicMaterial.components)}
                      />
                    </Suspense>
                  </VisualizationErrorBoundary>
                </DeferredContent>
              ) : (
                <p className="panel">No toxic-material component chart data is available for this organism yet.</p>
              )
            ) : null}

            {section.kind === 'chemistry' ? (
              <>
                {selectedChemistryToxin ? (
                  <div className="panel">
                    <h3>{selectedChemistryToxin.displayName}</h3>
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
                    <DeferredContent label="Interactive molecular structure">
                      <VisualizationErrorBoundary fallback="The molecular structure could not be displayed.">
                        <Suspense fallback={<p className="panel">Loading molecular viewer...</p>}>
                          <MoleculeViewer model={moleculeModel} />
                        </Suspense>
                      </VisualizationErrorBoundary>
                    </DeferredContent>
                  ) : (
                    <p className="panel">No 3D molecular structure asset is available for this toxin.</p>
                  )}
                </div>
                <section className="panel">
                  <h3>Evidence and sources</h3>
                  <CitationList citations={selectedChemistryToxin?.citations ?? []} />
                </section>
                {complexModel && selectedChemistryToxin ? (
                  <DeferredContent label="Target interaction structure">
                    <VisualizationErrorBoundary fallback="The target interaction viewer could not be displayed.">
                      <Suspense fallback={<p className="panel">Loading target interaction viewer...</p>}>
                        <StructureComplexViewer
                          model={complexModel}
                          annotationPath={selectedChemistryToxin.interactionVisualization?.annotationPath}
                          fallbackEvidence={selectedChemistryToxin.evidence}
                          citations={selectedChemistryToxin.citations}
                        />
                      </Suspense>
                    </VisualizationErrorBoundary>
                  </DeferredContent>
                ) : null}
              </>
            ) : null}

            {section.kind === 'physiology' ? (
              <>
                <section className="panel atlas-clinical-intro">
                  <p className="atlas-section-eyebrow">Observed {exposureRouteLabel(selected.deliveryMechanism.route)} exposure</p>
                  <h3>Effects on the human body</h3>
                  <p>
                    These findings describe the complete organism exposure. They are not attributed to an
                    isolated compound unless the cited evidence establishes that scope.
                  </p>
                </section>
                {anatomyHighlights.length > 0 ? <AnatomySvg highlights={anatomyHighlights} /> : null}
                <ol className="atlas-evidence-sequence">
                  {(selected.physiology?.effects ?? []).map((effect) => (
                    <li key={effect.id}>
                      <div>
                        <span className="atlas-effect-scope">{effect.pathwayType.replaceAll('_', ' ')}</span>
                        <h3>{effect.title}</h3>
                        <p>{effect.description}</p>
                        <CitationList citations={effect.citations} />
                      </div>
                      <EvidenceBadge evidence={effect.evidence} />
                    </li>
                  ))}
                </ol>
                {selected.physiology?.symptoms.some((symptom) => symptom.id === 'sym-systemic-allergy') ? (
                  <aside className="atlas-safety-note" aria-label="Urgent medical context">
                    <strong>Urgent context</strong>
                    <p>
                      Severe allergic reactions are uncommon but can be life-threatening. Difficulty breathing,
                      swelling away from the sting site, faintness, or widespread hives require emergency medical care.
                    </p>
                  </aside>
                ) : null}
              </>
            ) : null}
          </ScrollSection>
        ))}
      </section>

    </section>
  );
};
