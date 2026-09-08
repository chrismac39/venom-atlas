import { lazy, Suspense, type ReactNode } from 'react';
import type { Citation } from '@venom-atlas/domain';
import { CitationList } from '../components/CitationList';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { appPath } from '../lib/paths';
import type { AtlasMechanismStep, AtlasOrganismData, AtlasProvenance } from '../features/atlas/atlas-types';
import { exposureRouteLabel, toxicStrategyLabel } from '../lib/organism-labels';
import { DeferredContent } from '../features/atlas/components/DeferredContent';
import { ExternalMapEmbed } from '../features/atlas/components/ExternalMapEmbed';
import { VisualizationErrorBoundary } from '../features/atlas/components/VisualizationErrorBoundary';
import { atlasLegacyBookmarks, useAtlasMonopageOrchestration, type AtlasMonopageViewModel } from '../features/atlas/hooks/useAtlasMonopageOrchestration';
import { RangeMapPanel } from '../visualizations/maps/RangeMapPanel';

const MoleculeViewer = lazy(() =>
  import('../molecular/components/MoleculeViewer').then((module) => ({ default: module.MoleculeViewer })),
);
const StructureComplexViewer = lazy(() =>
  import('../molecular/components/StructureComplexViewer').then((module) => ({
    default: module.StructureComplexViewer,
  })),
);

const Sources = ({ citations, label = 'Sources' }: { citations: Citation[]; label?: string }) => (
  <details className="atlas-local-sources">
    <summary>{label}</summary>
    <CitationList citations={citations} />
  </details>
);

const Provenance = ({ value, label }: { value: AtlasProvenance; label?: string }) => (
  <div className="atlas-provenance">
    <EvidenceBadge evidence={value.evidence} />
    <Sources citations={value.citations} label={label ?? 'Sources'} />
  </div>
);

const MechanismSteps = ({ steps }: { steps: AtlasMechanismStep[] }) => (
  <ol className="atlas-evidence-sequence">
    {steps.map((step) => (
      <li key={`${step.subject.kind}-${step.subject.slug}-${step.id}`}>
        <div>
          <span className="atlas-effect-scope">{step.subject.kind.replaceAll('_', ' ')} · {step.level.replaceAll('_', ' ')}</span>
          <h3>{step.title}</h3>
          <p>{step.description}</p>
          <Provenance value={step.provenance} label={`Sources for ${step.title}`} />
        </div>
      </li>
    ))}
  </ol>
);

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

const AtlasMonopageHost = ({
  organism: selected, sections, activeSectionId, rootRef, taxonomyRanks,
  selectedChemistryToxin: toxin, selectChemistryToxin, moleculeModel, complexModel,
  chemistryMechanismSteps, medicalMechanismSteps, medicalEffects,
}: AtlasMonopageViewModel) => (
  <article ref={rootRef} className="atlas-monopage atlas-dossier">
    <header className="atlas-dossier-identity">
      <div>
        <p className="atlas-section-eyebrow">Species dossier</p>
        <h1><i>{selected.scientificName}</i></h1>
        <p className="atlas-organism-common-name">{selected.commonName}</p>
      </div>
      <a className="atlas-change-organism" href={appPath('/')}>Change organism</a>
    </header>

    <nav className="atlas-section-nav" aria-label="Organism sections">
      {sections.map((section) => (
        <a key={section.id} href={`#${section.id}`} aria-current={activeSectionId === section.id ? 'location' : undefined}>
          {section.title}
        </a>
      ))}
    </nav>

    {sections.map((section) => (
      <section key={section.id} id={section.id} className="atlas-scroll-section" data-scroll-section
        data-in-focus={activeSectionId === section.id ? 'true' : undefined}
        aria-labelledby={`${section.id}-heading`} tabIndex={-1}>
        {Object.entries(atlasLegacyBookmarks).filter(([, canonical]) => canonical === section.id).map(([alias]) => (
          <span key={alias} id={alias} className="atlas-bookmark-alias" aria-hidden="true" />
        ))}
        <header className="atlas-scroll-section-header"><h2 id={`${section.id}-heading`}>{section.title}</h2></header>
        <div className="atlas-scroll-section-content">
          {section.id === 'section-summary' ? (
            <>
              <p className="atlas-organism-strategy">{toxicStrategyLabel(selected.toxicStrategy)}</p>
              <p className="atlas-organism-lede">{selected.overview}</p>
              {selected.naturalHistory.map((point, index) => <p key={index}>{point}</p>)}
              <Provenance value={selected.provenance} label="Organism sources" />
              {selected.ecologicalRoles.map((role) => (
                <div key={role.id}>
                  <h3>{role.role}</h3><p>{role.summary}</p>
                  <Provenance value={role.provenance} />
                </div>
              ))}
              <div>
                <h3>How exposure occurs</h3>
                <p className="atlas-effect-scope">{exposureRouteLabel(selected.deliveryMechanism.route)}</p>
                <p>{selected.deliveryMechanism.summary}</p>
                {selected.deliveryMechanism.sequence.length > 0 ? (
                  <ol className="atlas-delivery-sequence" aria-label="Delivery sequence">
                    {selected.deliveryMechanism.sequence.map((step, index) => <li key={index}>{step}</li>)}
                  </ol>
                ) : null}
                <Provenance value={selected.deliveryMechanism.provenance} label="Delivery sources (organism record)" />
              </div>
              <details className="atlas-disclosure">
                <summary>Taxonomy</summary>
                <dl className="atlas-taxonomy-list">
                  {taxonomyRanks.map((rank) => (
                    <div key={rank.key}><dt>{rank.englishLabel}</dt><dd>{rank.value}</dd></div>
                  ))}
                </dl>
                <Sources citations={selected.provenance.citations} label="Taxonomy sources (organism record)" />
              </details>
              {selected.externalProfile?.summaryPoints.length ? (
                <details className="atlas-disclosure">
                  <summary>External reference summary</summary>
                  {selected.externalProfile.summaryPoints.map((point, index) => <p key={index}>{point}</p>)}
                  <a href={selected.externalProfile.sourceUrl} target="_blank" rel="noreferrer">{selected.externalProfile.sourceLabel}</a>
                </details>
              ) : null}
            </>
          ) : null}

          {section.id === 'section-geography' ? (
            <>
              {selected.geographySourceAudit ? (
                <div className="atlas-geography-audit">
                  <h3>Range evidence and precision</h3>
                  <p>{selected.geographySourceAudit.note}</p>
                  <p><strong>Source precision:</strong> {selected.geographySourceAudit.precision.replaceAll('_', ' ')}</p>
                  <p><strong>Native-range assessment:</strong> {selected.geographySourceAudit.decision.replaceAll('_', ' ')}</p>
                  <Sources citations={selected.geographySourceAudit.citations} label="Range assessment sources" />
                </div>
              ) : null}
              <DeferredContent label="Documented geography map">
                <VisualizationErrorBoundary fallback="The geography map could not be displayed. Range evidence remains below.">
                  <RangeMapPanel ranges={selected.geographyRanges} speciesId={selected.slug} geographyKind={selected.geographyKind} />
                </VisualizationErrorBoundary>
              </DeferredContent>
              {selected.geographyRanges.map((range) => (
                <div key={range.id}>
                  <h3>{range.layerType.replaceAll('_', ' ')}</h3>
                  <p>{range.summary}</p>
                  <Provenance value={range.provenance} label={`Sources for ${range.layerType.replaceAll('_', ' ')}`} />
                </div>
              ))}
              {selected.habitats.map((habitat) => (
                <div key={habitat.id}>
                  <h3>{habitat.name}</h3><p>{habitat.summary}</p>
                  <Provenance value={habitat.provenance} />
                </div>
              ))}
              {selected.geographyVisualizations.map((visualization) => <ExternalMapEmbed key={visualization.id} visualization={visualization} />)}
            </>
          ) : null}

          {section.id === 'section-chemistry' ? (
            <>
              {selected.toxicMaterial ? (
                <details id="chemistry-material" className="atlas-disclosure" open>
                  <summary>Toxic material and components</summary>
                  <h3>{selected.toxicMaterial.name}</h3>
                  <p>{selected.toxicMaterial.description}</p>
                  <p>{selected.toxicMaterial.ecologicalRoleSummary}</p>
                  <Provenance value={selected.toxicMaterial.provenance} label="Toxic material sources" />
                  <ul className="atlas-component-list">
                    {selected.toxicMaterial.components.map((component) => (
                      <li key={component.id}>
                        <div>
                          <h3>{component.componentCategory}</h3>
                          {component.summary ? <p>{component.summary}</p> : null}
                          {component.abundanceQualifier ? <p>Abundance: {component.abundanceQualifier.replaceAll('_', ' ')}</p> : null}
                          <Provenance value={component.provenance} label={`Sources for ${component.componentCategory}`} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
              {toxin ? (
                <div className="atlas-chemical-identity">
                  <label htmlFor="chemistry-toxin-select">Chemical component selector</label>
                  <select id="chemistry-toxin-select" value={toxin.slug} disabled={selected.toxins.length === 1}
                    onChange={(event) => selectChemistryToxin(event.target.value)}>
                    {selected.toxins.map((component) => <option key={component.slug} value={component.slug}>{component.displayName}</option>)}
                  </select>
                  <h3>{toxin.displayName}</h3>
                  {toxin.family ? <p><strong>Family:</strong> {toxin.family}</p> : null}
                  {toxin.notes ? <p>{toxin.notes}</p> : null}
                  <Provenance value={toxin.provenance} label="Toxin sources" />
                  <div className="chemistry-summary-layout">
                    <div className="chemistry-summary-copy">
                      <p><strong>Molecular class:</strong> {toxin.molecularClass.replaceAll('_', ' ')}</p>
                      {toxin.formula ? <p><strong>Formula:</strong> {renderChemicalFormula(toxin.formula)}</p> : null}
                      {toxin.molecularWeight !== null ? <p><strong>Molecular weight:</strong> {toxin.molecularWeight}</p> : null}
                      {toxin.structureDataSource ? <p><strong>Structure source:</strong> {toxin.structureDataSource}</p> : null}
                      <Provenance value={toxin.identityProvenance} label="Molecular identity sources" />
                    </div>
                    {toxin.structure2dUrl ? (
                      <figure className="chemistry-summary-2d">
                        <div className="chemistry-2d-viewport">
                          <img className="chemistry-2d-asset" src={toxin.structure2dUrl} alt={`2D skeletal structure for ${toxin.displayName}`} loading="lazy" />
                        </div>
                        <figcaption><a href={toxin.structure2dUrl} target="_blank" rel="noopener noreferrer">Open full-size 2D formula (new tab)</a></figcaption>
                      </figure>
                    ) : null}
                  </div>
                  {toxin.structureSources.map((source) => (
                    <div key={source.id} className="atlas-structure-source">
                      <p><strong>{source.format.toUpperCase()} structure:</strong> {source.status}</p>
                      {source.sourceUrl ? <a href={source.sourceUrl} target="_blank" rel="noreferrer">Structure record</a> : null}
                      <Sources citations={source.citations} label={`${source.format.toUpperCase()} structure sources`} />
                    </div>
                  ))}
                </div>
              ) : null}
              {chemistryMechanismSteps.length > 0 || (toxin?.targets.length ?? 0) > 0 ? (
                <details className="atlas-disclosure">
                  <summary>Molecular targets and mechanisms</summary>
                  {toxin?.targets.map((target) => (
                    <div key={target.id}>
                      <span className="atlas-effect-scope">Isolated compound · {toxin.displayName}</span>
                      <h3>{target.targetName}</h3><p>{target.summary}</p>
                      <Provenance value={target.provenance} label={`Sources for ${target.targetName}`} />
                    </div>
                  ))}
                  <MechanismSteps steps={chemistryMechanismSteps} />
                </details>
              ) : null}
              {moleculeModel ? (
                <details className="atlas-disclosure">
                  <summary>Interactive molecular structure</summary>
                  <DeferredContent label="Interactive molecular structure">
                    <VisualizationErrorBoundary fallback="The molecular structure could not be displayed.">
                      <Suspense fallback={<p>Loading molecular viewer...</p>}><MoleculeViewer model={moleculeModel} /></Suspense>
                    </VisualizationErrorBoundary>
                  </DeferredContent>
                </details>
              ) : null}
              {complexModel && toxin ? (
                <details className="atlas-disclosure">
                  <summary>Target interaction structure</summary>
                  <DeferredContent label="Target interaction structure">
                    <VisualizationErrorBoundary fallback="The target interaction viewer could not be displayed.">
                      <Suspense fallback={<p>Loading target interaction viewer...</p>}>
                        <StructureComplexViewer model={complexModel} annotationPath={toxin.interactionVisualization?.annotationPath}
                          fallbackEvidence={toxin.evidence} citations={toxin.citations} />
                      </Suspense>
                    </VisualizationErrorBoundary>
                  </DeferredContent>
                </details>
              ) : null}
            </>
          ) : null}

          {section.id === 'section-medical-effects' ? (
            <>
              <p className="atlas-section-eyebrow">Organism exposure · {exposureRouteLabel(selected.deliveryMechanism.route)}</p>
              <MechanismSteps steps={medicalMechanismSteps} />
              <ol className="atlas-evidence-sequence">
                {medicalEffects.map((effect) => (
                  <li key={effect.id}>
                    <div>
                      <span className="atlas-effect-scope">Organism exposure · {effect.pathwayType.replaceAll('_', ' ')}</span>
                      <h3>{effect.title}</h3><p>{effect.description}</p>
                      <Provenance value={effect} label={`Sources for ${effect.title}`} />
                    </div>
                  </li>
                ))}
              </ol>
              {selected.physiology?.symptoms.length ? (
                <details className="atlas-disclosure">
                  <summary>Reported symptoms</summary>
                  {selected.physiology.symptoms.map((symptom) => (
                    <div key={symptom.id}>
                      <h3>{symptom.name}</h3><p>{symptom.description}</p>
                      <Provenance value={symptom} label={`Sources for ${symptom.name}`} />
                    </div>
                  ))}
                </details>
              ) : null}
            </>
          ) : null}
        </div>
      </section>
    ))}
  </article>
);

export const AtlasMonopageIsland = ({ organism }: { organism: AtlasOrganismData }) => {
  const viewModel = useAtlasMonopageOrchestration(organism);
  return <AtlasMonopageHost {...viewModel} />;
};
