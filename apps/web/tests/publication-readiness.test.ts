import { describe, expect, it, vi } from 'vitest';
import type { ContentRecords } from '../src/lib/content';
import { auditContentGraph } from '../src/lib/content-graph-audit';
import { buildRouteInventory } from '../src/lib/content-routes';
import { evaluatePublicationReadiness, publicationSections, selectPublicationContent,
  type PublicationSection } from '../src/lib/publication-readiness';
import { dossierWithAssets, emptyContent, mergeContent, readyDossier } from './fixtures/publication-readiness';

type Mutation = (content: ContentRecords) => void;
const evaluate = (content = readyDossier()) => evaluatePublicationReadiness(content, () => true)[0]!;
const changed = (mutate: Mutation) => {
  const content = readyDossier();
  mutate(content);
  return evaluate(content);
};
const expectFailure = (content: ContentRecords, section: PublicationSection | 'pipeline', code: string, path?: string) => {
  const report = evaluate(content);
  expect(report.eligible).toBe(false);
  expect(report.failures).toContainEqual(expect.objectContaining({ section, code, ...(path ? { path } : {}) }));
  if (section !== 'pipeline') expect(report.sections[section].ready).toBe(false);
  return report;
};

describe('automated four-section publication readiness', () => {
  it('accepts a clean structured dossier with substantive source-backed content in every section', () => {
    const content = readyDossier();
    expect(auditContentGraph(content).issues).toEqual([]);
    expect(publicationSections).toEqual(['summary', 'geography', 'chemistry', 'medical-effects']);
    expect(evaluate(content)).toEqual({ slug: 'test-organism', eligible: true, failures: [], sections: {
      summary: { ready: true, failures: [] }, geography: { ready: true, failures: [] },
      chemistry: { ready: true, failures: [] }, 'medical-effects': { ready: true, failures: [] },
    } });
  });

  it('does not require human approval, review metadata, or generation metadata', () => {
    const content = readyDossier();
    expect(JSON.stringify(content)).not.toMatch(/reviewStatus|reviewedAt|approvedBy|generatedAt/);
    expect(auditContentGraph(content).summary.reviewedClaims).toBe(0);
    expect(evaluate(content).eligible).toBe(true);
  });

  it('accepts AI-generation properties without treating them as review or source support', () => {
    const content = readyDossier();
    Object.assign(content.organisms[0]!, { generation: {
      generatedBy: 'ai', model: 'synthetic-model', promptVersion: 'test-v1',
      generatedAt: '2026-09-08T00:00:00Z', sourceRetrievedAt: '2026-09-07T00:00:00Z',
    } });
    const before = structuredClone(content);
    expect(evaluate(content).eligible).toBe(true);
    expect(auditContentGraph(content).summary.reviewedClaims).toBe(0);
    expect(content).toEqual(before);
    content.organisms[0]!.evidence.citationIds = [];
    expectFailure(content, 'summary', 'public_source_required');
  });

  it.each(['failed', 'quarantined'] as const)('blocks a %s assertion without creating a human approval gate', (status) => {
    const content = readyDossier();
    content.toxins[0]!.molecularEntity.assertions = [{
      id: 'claim-test-mass', claimType: 'property', label: 'Molecular weight',
      value: { kind: 'number', amount: 42, unit: 'g/mol' },
      scope: { subjectKind: 'isolated_compound', subjectSlug: 'test-toxin', property: 'molecular_weight' },
      conditions: [], applicability: { evidenceContext: 'inference', summary: 'Computed fixture value.' },
      sourceLocators: [{ citationId: 'cit-test-organism-chemistry', locator: 'Computed properties' }],
      provenance: { method: 'pubchem_import', methodVersion: 'fixture-v1', retrievedAt: '2026-09-08T00:00:00Z', checkedAt: '2026-09-08T00:00:00Z' },
      validation: { status, checkedAt: '2026-09-08T00:00:00Z', checks: ['fixture_check'] },
    }];
    expectFailure(content, 'chemistry', 'assertion_validation_required', 'claim-test-mass');
  });

  it.each(['unreviewed', 'needs_review'] as const)('does not turn %s into a human approval gate', (reviewStatus) => {
    expect(changed((content) => { content.organisms[0]!.evidence.reviewStatus = reviewStatus; }).eligible).toBe(true);
  });

  it('accepts explicit, contextualized nonhuman applicability without inventing human effects', () => {
    const content = readyDossier();
    content.physiology[0]!.applicability = { scope: 'non_human', summary: 'Effects were observed in a nonhuman experimental model only.' };
    const before = structuredClone(content);
    expect(evaluate(content).eligible).toBe(true);
    expect(content).toEqual(before);
  });

  it.each(['peptide', 'protein', 'complex'] as const)('does not require exact small-molecule properties for %s', (molecularClass) => {
    expect(changed((content) => {
      Object.assign(content.toxins[0]!.molecularEntity, { molecularClass, formula: null, molecularWeight: null, structureDataSource: null });
    }).eligible).toBe(true);
  });

  it.each(['marine', 'ubiquitous'] as const)('allows supported %s occurrence geography without terrestrial polygons', (kind) => {
    const content = readyDossier();
    const geography = content.geography[0]!;
    geography.geographyKind = kind === 'marine' ? 'marine' : 'terrestrial';
    geography.sourceAudit.decision = 'native_range_not_meaningful';
    expect(geography.distribution).toBeUndefined();
    expect(geography.ranges[0]!.geometryAssetPath).toBeUndefined();
    const checkAsset = vi.fn(() => false);
    expect(evaluatePublicationReadiness(content, checkAsset)[0]!.eligible).toBe(true);
    expect(checkAsset).not.toHaveBeenCalled();
  });

  const incomplete: Array<[string, PublicationSection, string, Mutation]> = [
    ['blank overview', 'summary', 'substantive_summary_required', (c) => { c.organisms[0]!.overview = ' \n '; }],
    ['heading-only overview', 'summary', 'substantive_summary_required', (c) => { c.organisms[0]!.overview = 'Summary'; }],
    ['empty natural history', 'summary', 'substantive_summary_required', (c) => { c.organisms[0]!.naturalHistory = []; }],
    ['placeholder natural history', 'summary', 'substantive_summary_required', (c) => { c.organisms[0]!.naturalHistory = ['Not yet sourced']; }],
    ['empty delivery summary', 'summary', 'substantive_summary_required', (c) => { c.organisms[0]!.deliveryMechanism.summary = ''; }],
    ['unknown exposure route', 'summary', 'substantive_summary_required', (c) => { c.organisms[0]!.deliveryMechanism.route = 'unknown'; }],
    ['absent geography', 'geography', 'substantive_geography_required', (c) => { c.geography = []; }],
    ['empty source audit note', 'geography', 'substantive_geography_required', (c) => { c.geography[0]!.sourceAudit.note = ''; }],
    ['empty ranges', 'geography', 'substantive_geography_required', (c) => { c.geography[0]!.ranges = []; }],
    ['heading-only range', 'geography', 'substantive_geography_required', (c) => { c.geography[0]!.ranges[0]!.summary = 'Geography'; }],
    ['absent material', 'chemistry', 'substantive_chemistry_required', (c) => { c.toxicMaterials = []; }],
    ['empty material description', 'chemistry', 'substantive_chemistry_required', (c) => { c.toxicMaterials[0]!.description = ''; }],
    ['empty components', 'chemistry', 'substantive_chemistry_required', (c) => { c.toxicMaterials[0]!.components = []; }],
    ['component without context', 'chemistry', 'substantive_chemistry_required', (c) => { delete c.toxicMaterials[0]!.components[0]!.summary; }],
    ['absent toxin', 'chemistry', 'substantive_chemistry_required', (c) => { c.toxins = []; }],
    ['empty molecular display name', 'chemistry', 'identity_context_required', (c) => { c.toxins[0]!.molecularEntity.displayName = ' '; }],
    ['absent toxin context', 'chemistry', 'identity_context_required', (c) => { delete c.toxins[0]!.notes; }],
    ['missing formula', 'chemistry', 'small_molecule_identity_required', (c) => { c.toxins[0]!.molecularEntity.formula = null; }],
    ['missing mass', 'chemistry', 'small_molecule_identity_required', (c) => { c.toxins[0]!.molecularEntity.molecularWeight = null; }],
    ['zero mass', 'chemistry', 'small_molecule_identity_required', (c) => { c.toxins[0]!.molecularEntity.molecularWeight = 0; }],
    ['negative mass', 'chemistry', 'small_molecule_identity_required', (c) => { c.toxins[0]!.molecularEntity.molecularWeight = -1; }],
    ['missing structure data source', 'chemistry', 'small_molecule_identity_required', (c) => { c.toxins[0]!.molecularEntity.structureDataSource = null; }],
    ['absent physiology', 'medical-effects', 'substantive_effects_required', (c) => { c.physiology = []; }],
    ['empty effects', 'medical-effects', 'substantive_effects_required', (c) => { c.physiology[0]!.effects = []; }],
    ['heading-only effects', 'medical-effects', 'substantive_effects_required', (c) => { c.physiology[0]!.effects[0]!.description = 'Medical Effects'; }],
    ['missing applicability', 'medical-effects', 'applicability_required', (c) => { delete c.physiology[0]!.applicability; }],
    ['blank applicability', 'medical-effects', 'applicability_required', (c) => { c.physiology[0]!.applicability!.summary = ' '; }],
    ['compound-only physiology', 'medical-effects', 'substantive_effects_required', (c) => { c.physiology[0]!.subject = { kind: 'isolated_compound', slug: c.toxins[0]!.slug }; }],
  ];
  it.each(incomplete)('rejects %s', (_name, section, code, mutate) => {
    const content = readyDossier();
    mutate(content);
    const report = expectFailure(content, section, code);
    for (const other of publicationSections.filter((entry) => entry !== section)) expect(report.sections[other].ready).toBe(true);
  });

  it('aggregates every incomplete section with stable machine-readable reasons', () => {
    const content = readyDossier();
    content.organisms[0]!.overview = '';
    content.geography = [];
    content.toxicMaterials = [];
    content.physiology = [];
    const report = evaluate(content);
    expect(report.eligible).toBe(false);
    for (const section of publicationSections) {
      expect(report.sections[section].ready).toBe(false);
      expect(report.sections[section].failures).toEqual(report.failures.filter((failure) => failure.section === section));
      expect(report.sections[section].failures.length).toBeGreaterThan(0);
    }
    expect(evaluate(content)).toEqual(report);
  });
});

describe('public source traceability', () => {
  const assessments = (content: ContentRecords) => [content.organisms[0]!.evidence, content.geography[0]!.ranges[0]!.evidence,
    content.toxicMaterials[0]!.evidence, content.toxicMaterials[0]!.components[0]!.evidence, content.toxins[0]!.evidence,
    content.toxins[0]!.molecularEntity.evidence, content.toxins[0]!.targets[0]!.evidence, content.mechanisms[0]!.steps[0]!.evidence,
    content.physiology[0]!.effects[0]!.evidence, content.physiology[0]!.symptoms[0]!.evidence];

  it('rejects editorial-only content even with a complete public bibliography and review labels', () => {
    const content = readyDossier();
    for (const evidence of assessments(content)) {
      evidence.evidenceType = 'editorial_normalization';
      evidence.reviewStatus = 'reviewed';
      evidence.reviewedAt = '2026-09-08';
    }
    const report = evaluate(content);
    expect(report.eligible).toBe(false);
    for (const section of publicationSections) expect(report.sections[section].ready).toBe(false);
    expect(report.failures).toContainEqual(expect.objectContaining({ section: 'pipeline', code: 'unsupported_claim' }));
  });

  it.each(publicationSections)('rejects missing or duplicate citations supporting %s', (section) => {
    const content = readyDossier();
    const citation = content.citations.find((entry) => entry.id === `cit-test-organism-${section}`)!;
    content.citations = content.citations.filter((entry) => entry !== citation);
    expectFailure(content, section, 'public_source_required');
    expectFailure(content, 'pipeline', 'invalid_reference');
    content.citations.push(citation, structuredClone(citation));
    expectFailure(content, section, 'public_source_required');
    expectFailure(content, 'pipeline', 'duplicate_id');
  });

  it.each(['internal', 'blank-title', 'no-locator', 'invalid-url', 'invalid-doi'] as const)('rejects %s source metadata', (scenario) => {
    const content = readyDossier();
    const citation = content.citations[0]!;
    if (scenario === 'internal') citation.visibility = 'internal';
    if (scenario === 'blank-title') citation.title = ' \n ';
    if (scenario === 'no-locator') delete citation.url;
    if (scenario === 'invalid-url') citation.url = 'ftp://example.org/source';
    if (scenario === 'invalid-doi') { delete citation.url; citation.doi = 'not-a-doi'; }
    expectFailure(content, 'summary', 'public_source_required', 'org-test-organism');
  });

  it('accepts DOI-only public sources and implicit public visibility', () => {
    const content = readyDossier();
    for (const [index, citation] of content.citations.entries()) {
      delete citation.url;
      citation.doi = `10.1234/test-${index}`;
      expect(citation.visibility).toBeUndefined();
    }
    expect(evaluate(content).eligible).toBe(true);
  });

  it('requires every cited support reference to resolve, not just one good citation', () => {
    const content = readyDossier();
    content.organisms[0]!.evidence.citationIds.push('missing-source');
    expectFailure(content, 'summary', 'public_source_required');
    content.organisms[0]!.evidence.citationIds = [];
    expectFailure(content, 'summary', 'public_source_required');
  });

  it('does not substitute range evidence for an uncited geography source audit', () => {
    const content = readyDossier();
    content.geography[0]!.sourceAudit.citationIds = [];
    expectFailure(content, 'geography', 'public_source_required', 'geography-test-organism');
  });
});

describe('injected asset validation and provenance', () => {
  const assets: Array<[PublicationSection, string]> = [
    ['summary', '/images/test.svg'], ['chemistry', '/structures/test.sdf'],
    ['geography', '/geography/test-occurrences.geojson'], ['geography', '/geography/test-source.geojson'],
    ['geography', '/geography/test-range.geojson'],
  ];
  it('checks every referenced scientific asset and accepts a valid asset-backed dossier', () => {
    const assetCheck = vi.fn<(path: string) => boolean>().mockReturnValue(true);
    expect(evaluatePublicationReadiness(dossierWithAssets(), assetCheck)[0]!.eligible).toBe(true);
    expect(new Set(assetCheck.mock.calls.map(([asset]) => asset))).toEqual(new Set(assets.map(([, asset]) => asset)));
  });

  it.each(assets)('rejects invalid %s asset %s', (section, path) => {
    const report = evaluatePublicationReadiness(dossierWithAssets(), (asset) => asset !== path)[0]!;
    expect(report.eligible).toBe(false);
    expect(report.sections[section]).toEqual({ ready: false, failures: [{ section, code: 'invalid_asset', path }] });
  });

  it.each(['license', 'attributionText', 'citationId'] as const)('requires image %s provenance', (key) => {
    const content = dossierWithAssets();
    delete content.media[0]![key];
    expectFailure(content, 'summary', 'media_provenance_required', 'media-test');
  });

  it.each(['verified', 'citationId', 'sourceUrl'] as const)('requires scientific structure %s provenance', (key) => {
    const content = dossierWithAssets();
    if (key === 'verified') content.toxins[0]!.structureAssets[0]!.verified = false;
    else delete content.toxins[0]!.structureAssets[0]![key];
    expectFailure(content, 'chemistry', 'structure_provenance_required', 'structure-test');
  });

  it.each(['illustrative', 'placeholder'] as const)('does not treat %s structures as verified molecular identity', (structureStatus) => {
    const content = readyDossier();
    content.toxins[0]!.structureAssets = [{ id: 'optional-structure', localPath: '/structures/optional.svg', format: 'svg', structureStatus, verified: false }];
    const assetCheck = vi.fn(() => false);
    expect(evaluatePublicationReadiness(content, assetCheck)[0]!.eligible).toBe(true);
    expect(assetCheck).not.toHaveBeenCalled();
  });

  it.each(['missing', 'unverified'] as const)('rejects a selected organism image with %s media provenance', (scenario) => {
    const content = dossierWithAssets();
    if (scenario === 'missing') content.media = [];
    else content.media[0]!.redistributionVerified = false;
    expectFailure(content, 'summary', 'media_provenance_required', '/images/test.svg');
  });
});

describe('pipeline graph validation', () => {
  const invalidGraphs: Array<[string, Mutation]> = [
    ['invalid_reference', (c) => { c.physiology[0]!.effects[0]!.anatomicalSystemId = 'missing-system'; }],
    ['invalid_reference', (c) => { c.physiology[0]!.effects[0]!.symptomId = 'missing-symptom'; }],
    ['invalid_reference', (c) => { c.mechanisms[0]!.steps[0]!.targetId = 'missing-target'; }],
    ['invalid_reference', (c) => { c.toxicMaterials[0]!.featuredToxinSlug = 'missing-toxin'; }],
    ['invalid_reference', (c) => { c.geography[0]!.sourceAudit.evidenceIds = ['missing-evidence']; }],
    ['duplicate_id', (c) => { c.toxins[0]!.targets.push(structuredClone(c.toxins[0]!.targets[0]!)); }],
    ['duplicate_subject', (c) => { c.mechanisms.push({ ...structuredClone(c.mechanisms[0]!), id: 'second-mechanism', slug: 'second-mechanism' }); }],
    ['duplicate_geography_owner', (c) => { c.geography.push({ ...structuredClone(c.geography[0]!), id: 'second-geography', slug: 'second-geography' }); }],
    ['organism_id_mismatch', (c) => { c.organisms[0]!.id = 'wrong-id'; }],
    ['invalid_slug', (c) => { c.toxins[0]!.slug = '../unsafe'; c.toxicMaterials[0]!.featuredToxinSlug = '../unsafe'; }],
    ['conflicting_evidence_id', (c) => { c.toxins[0]!.molecularEntity.evidence.notes = 'A conflicting reused evidence definition.'; }],
    ['causal_scope_mismatch', (c) => { c.mechanisms[0]!.steps[0]!.evidence = { ...c.mechanisms[0]!.steps[0]!.evidence, id: 'ev-wrong-scope', causalScope: 'isolated_compound' }; }],
    ['invalid_review', (c) => { c.organisms[0]!.evidence.reviewStatus = 'reviewed'; }],
    ['route_collision', (c) => { c.citations[1]!.aliases.push(c.citations[0]!.slug); }],
  ];
  it.each(invalidGraphs)('rejects graph error %s even when all four sections are populated', (code, mutate) => {
    const content = readyDossier();
    mutate(content);
    const report = expectFailure(content, 'pipeline', code);
    expect(publicationSections.every((section) => report.sections[section].ready)).toBe(true);
    expect(report.failures.filter((failure) => failure.section === 'pipeline')).toEqual(
      auditContentGraph(selectPublicationContent(content, new Set(['test-organism']))).issues.map((issue) => ({ section: 'pipeline', code: issue.code, path: issue.path })),
    );
  });

  it('rejects unsupported nested chemistry claims even when the required section content is sourced', () => {
    const content = readyDossier();
    content.toxins[0]!.targets[0]!.evidence = { id: 'ev-unsupported-target', confidence: 'unknown', evidenceType: 'editorial_normalization', citationIds: [] };
    expectFailure(content, 'pipeline', 'unsupported_claim');
  });
});

describe('publication projection and draft isolation', () => {
  it('supports empty input and an empty eligible roster without a fallback organism', () => {
    expect(evaluatePublicationReadiness(emptyContent(), () => false)).toEqual([]);
    expect(selectPublicationContent(emptyContent(), new Set())).toEqual(emptyContent());
    const draft = readyDossier();
    draft.physiology = [];
    const report = evaluatePublicationReadiness(draft, () => true);
    expect(report).toHaveLength(1);
    const published = selectPublicationContent(draft, new Set(report.filter((entry) => entry.eligible).map((entry) => entry.slug)));
    expect(published).toEqual(emptyContent());
    expect(buildRouteInventory(published)).not.toContain('/atlas/test-organism');
  });

  it('keeps only eligible graph records and relevant sources without changing raw drafts', () => {
    const ready = readyDossier('ready');
    const draft = readyDossier('draft');
    draft.physiology = [];
    // A source used by both dossiers stays public; draft-exclusive sources do not.
    draft.organisms[0]!.evidence.citationIds = [ready.citations[0]!.id];
    ready.citations[0]!.aliases = ['legacy-ready-source'];
    const content = mergeContent(ready, draft);
    content.citations.push({ id: 'unused-source', slug: 'unused-source', aliases: [], title: 'Unused source', sourceType: 'other' });
    const before = structuredClone(content);
    const report = evaluatePublicationReadiness(content, () => true);
    expect(report.map(({ slug, eligible }) => ({ slug, eligible }))).toEqual([{ slug: 'ready', eligible: true }, { slug: 'draft', eligible: false }]);
    const selected = selectPublicationContent(content, new Set(report.filter((entry) => entry.eligible).map((entry) => entry.slug)));
    expect(selected).toEqual(ready);
    expect(auditContentGraph(selected).issues).toEqual([]);
    expect(buildRouteInventory(selected)).toContain('/sources/legacy-ready-source');
    expect(buildRouteInventory(selected).some((route) => route.includes('draft') || route.includes('unused-source'))).toBe(false);
    expect(content).toEqual(before);
    expect(evaluatePublicationReadiness(content, () => true)).toEqual(report);
  });

  it.each(['organism_exposure', 'whole_material', 'isolated_compound'] as const)('projects %s subjects only through selected owners', (kind) => {
    const ready = readyDossier('ready');
    const draft = readyDossier('draft');
    for (const content of [ready, draft]) {
      const slug = kind === 'organism_exposure' ? content.organisms[0]!.slug : kind === 'whole_material' ? content.toxicMaterials[0]!.slug : content.toxins[0]!.slug;
      content.mechanisms[0]!.subject = { kind, slug };
      content.physiology[0]!.subject = { kind, slug };
    }
    expect(selectPublicationContent(mergeContent(ready, draft), new Set(['ready']))).toEqual(ready);
  });

  it('retains citations referenced only by selected assets or nested graph records', () => {
    const content = dossierWithAssets();
    const source = (name: string) => ({ id: `cit-${name}`, slug: `${name}-source`, aliases: [], title: `${name} source`, sourceType: 'other' as const, url: `https://example.org/${name}` });
    content.citations.push(source('image'), source('structure'), source('target'), source('irrelevant'));
    content.media[0]!.citationId = 'cit-image';
    content.toxins[0]!.structureAssets[0]!.citationId = 'cit-structure';
    content.toxins[0]!.targets[0]!.evidence = { ...content.toxins[0]!.targets[0]!.evidence, id: 'ev-target-only', citationIds: ['cit-target'] };
    content.media.push({ id: 'unrelated-media', kind: 'organism_photo', localPath: '/images/unrelated.svg', redistributionVerified: true, citationId: 'cit-irrelevant' });
    const selected = selectPublicationContent(content, new Set(['test-organism']));
    expect(selected.media.map((entry) => entry.id)).toEqual(['media-test']);
    expect(selected.citations.map((entry) => entry.id)).toEqual(expect.arrayContaining(['cit-image', 'cit-structure', 'cit-target']));
    expect(selected.citations.some((entry) => entry.id === 'cit-irrelevant')).toBe(false);
    expect(evaluate(content).eligible).toBe(true);
  });

  it('does not let unrelated broken drafts or assets poison an eligible dossier', () => {
    const ready = readyDossier('ready');
    const draft = dossierWithAssets();
    draft.organisms[0]!.overview = '';
    draft.physiology[0]!.effects[0]!.anatomicalSystemId = 'missing-system';
    const checkAsset = vi.fn(() => false);
    const report = evaluatePublicationReadiness(mergeContent(ready, draft), checkAsset);
    expect(report[0]!.eligible).toBe(true);
    expect(report[1]!.eligible).toBe(false);
    expect(selectPublicationContent(mergeContent(ready, draft), new Set(['ready']))).toEqual(ready);
  });

  it('does not include unreferenced or redistribution-unverified media in the projection', () => {
    const content = dossierWithAssets();
    content.media[0]!.redistributionVerified = false;
    expect(selectPublicationContent(content, new Set(['test-organism'])).media).toEqual([]);
    expect(selectPublicationContent(content, new Set(['nonexistent']))).toEqual(emptyContent());
  });
});