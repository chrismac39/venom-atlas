import { describe, expect, it } from 'vitest';
import {
  getAllCitations,
  getAllRoutes,
  getCitationBySlug,
  getContentRecords,
  getMechanismByToxinSlug,
  getPhysiologyByToxinSlug,
  type ContentRecords,
} from '../src/lib/content';
import { auditContentGraph } from '../src/lib/content-graph-audit';
import { buildRouteInventory, compareBuiltRoutes } from '../src/lib/content-routes';

// A deliberately synthetic supported fixture. These substitutions exist ONLY in
// tests; they are not scientific sourcing changes to the authored content.
const fixture = (): ContentRecords => {
  const content = structuredClone(getContentRecords());
  content.organisms = content.organisms.filter((entry) => entry.slug === 'solenopsis-invicta');
  content.organisms[0]!.geographyVisualizations = [{
    id: 'test-geography-visualization', kind: 'external_embed', provider: 'Test', label: 'Test', url: 'https://example.org/',
  }];
  content.toxicMaterials = content.toxicMaterials.filter((entry) => entry.organismSlug === 'solenopsis-invicta');
  content.toxins = content.toxins.filter((entry) => entry.slug === 'solenopsin-a');
  content.mechanisms = content.mechanisms.filter((entry) => entry.subject.slug === 'solenopsis-invicta');
  content.physiology = content.physiology.filter((entry) => entry.subject.slug === 'solenopsis-invicta');
  content.geography = content.geography.filter((entry) => entry.organismSlug === 'solenopsis-invicta');
  content.citations.push({ id: 'cit-test-public', slug: 'test-public', aliases: [], title: 'Synthetic test source', sourceType: 'other' });
  for (const assessment of [content.toxins[0]!.evidence, content.toxins[0]!.molecularEntity.evidence]) {
    assessment.evidenceType = 'database';
    assessment.citationIds = ['cit-test-public'];
  }
  return content;
};

const issuesAfter = (mutate: (content: ContentRecords) => void) => {
  const content = fixture();
  mutate(content);
  return auditContentGraph(content).issues;
};

describe('authored content graph integrity', () => {
  it('accepts the supported fixture, including identical reused evidence assessments', () => {
    expect(auditContentGraph(fixture()).issues).toEqual([]);
  });

  it('rejects empty IDs/slugs and organism IDs incompatible with bundle foreign keys', () => {
    const issues = issuesAfter((content) => {
      content.citations[0]!.slug = '';
      content.toxins[0]!.targets[0]!.id = ' ';
      content.organisms[0]!.id = 'wrong-organism-id';
    });
    expect(issues.map((issue) => issue.code)).toEqual(expect.arrayContaining(['invalid_slug', 'invalid_id', 'organism_id_mismatch']));
  });

  it('does not emit legacy draft JSON through publication-gated generators', async () => {
    const { existsSync } = await import('node:fs');
    const { getPublicAssetAbsolutePath } = await import('../src/lib/content');
    expect(existsSync(getPublicAssetAbsolutePath('/data/toxins/solenopsin-a.json'))).toBe(false);
    expect(existsSync(getPublicAssetAbsolutePath('/data/toxic-materials/eunice-aphroditois-secretion.json'))).toBe(false);
  });

  it('canonicalizes Redback while retaining both public source slugs', () => {
    const sources = getAllCitations().filter((entry) => entry.id === 'cit-australian-museum-redback');
    expect(sources).toHaveLength(1);
    expect(getCitationBySlug('australian-museum-redback')).toBe(sources[0]);
    expect(getCitationBySlug('australian-museum-redback-spider')).toBe(sources[0]);
    expect(sources[0]?.url).toBe('https://australian.museum/learn/animals/spiders/redback-spider/');
  });

  it('keeps one Fire Ant exposure bundle per kind without relabeling it as compound evidence', () => {
    const raw = getContentRecords();
    expect(raw.mechanisms.filter((entry) => entry.subject.slug === 'solenopsis-invicta')).toHaveLength(1);
    expect(raw.physiology.filter((entry) => entry.subject.slug === 'solenopsis-invicta')).toHaveLength(1);
    expect(raw.mechanisms.filter((entry) => entry.subject.kind === 'isolated_compound' && entry.subject.slug === 'solenopsin-a')).toEqual([]);
    expect(raw.physiology.filter((entry) => entry.subject.kind === 'isolated_compound' && entry.subject.slug === 'solenopsin-a')).toEqual([]);
    expect(getMechanismByToxinSlug('solenopsin-a')).toBeUndefined();
    expect(getPhysiologyByToxinSlug('solenopsin-a')).toBeUndefined();
  });

  it.each(['citations', 'organisms', 'toxicMaterials', 'toxins', 'mechanisms', 'physiology', 'geography', 'media'] as const)(
    'rejects duplicate IDs in %s, even when records are identical', (kind) => {
      const issues = issuesAfter((content) => {
        // Preserve each collection's own record type while injecting an exact duplicate.
        const records = content[kind] as Array<{ id: string }>;
        records.push(structuredClone(records[0]!));
      });
      expect(issues.some((issue) => issue.code === 'duplicate_id')).toBe(true);
    },
  );

  it('rejects duplicate citation slugs and alias/canonical collisions', () => {
    const issues = issuesAfter((content) => {
      content.citations[1]!.slug = content.citations[0]!.slug;
      content.citations[2]!.aliases.push(content.citations[0]!.slug);
    });
    expect(issues.filter((issue) => issue.code === 'duplicate_source_slug')).toHaveLength(2);
    expect(issues.some((issue) => issue.code === 'route_collision')).toBe(true);
  });

  it('rejects divergent globally addressed evidence, even on otherwise supported claims', () => {
    expect(issuesAfter((content) => {
      content.physiology[0]!.effects[0]!.evidence.notes = 'Different assessment under the same ID';
    }).some((issue) => issue.code === 'conflicting_evidence_id')).toBe(true);
  });

  it.each(['habitats', 'ecologicalRoles', 'geographyVisualizations'] as const)('checks nested organism %s IDs', (kind) => {
    expect(issuesAfter((content) => {
      const records = content.organisms[0]![kind] as Array<{ id: string }>;
      records.push(structuredClone(records[0]!));
    }).some((issue) => issue.code === 'duplicate_id')).toBe(true);
  });

  it('checks nested component, structure, target, step, anatomy, symptom, and effect IDs', () => {
    const content = fixture();
    const arrays: Array<Array<{ id: string }>> = [content.toxicMaterials[0]!.components,
      content.toxins[0]!.structureAssets, content.toxins[0]!.targets, content.mechanisms[0]!.steps,
      content.physiology[0]!.anatomicalSystems, content.physiology[0]!.symptoms, content.physiology[0]!.effects];
    arrays.forEach((records) => records.push(structuredClone(records[0]!)));
    expect(auditContentGraph(content).issues.filter((issue) => issue.code === 'duplicate_id')).toHaveLength(arrays.length);
  });

  it.each(['mechanisms', 'physiology'] as const)('rejects a second %s bundle for the same scoped subject', (kind) => {
    expect(issuesAfter((content) => {
      content[kind].push({ ...structuredClone(content[kind][0]!), id: 'another-bundle', slug: 'another-bundle' } as never);
    }).some((issue) => issue.code === 'duplicate_subject')).toBe(true);
  });

  it('rejects missing and cross-bundle anatomy and symptom references', () => {
    const issues = issuesAfter((content) => {
      content.physiology[0]!.effects[0]!.anatomicalSystemId = 'missing-system';
      content.physiology[0]!.effects[0]!.symptomId = 'sym-botulism-paralysis';
    });
    expect(issues.filter((issue) => issue.code === 'invalid_reference')).toHaveLength(2);
  });

  it('accepts an in-scope target and rejects an unknown target', () => {
    const content = fixture();
    content.mechanisms[0]!.steps[0]!.targetId = content.toxins[0]!.targets[0]!.id;
    expect(auditContentGraph(content).issues).toEqual([]);
    content.mechanisms[0]!.steps[0]!.targetId = 'missing-target';
    expect(auditContentGraph(content).issues).toEqual([expect.objectContaining({ code: 'invalid_reference' })]);
  });

  it('audits citation references on structures, media, source audits, and ordinary evidence', () => {
    const issues = issuesAfter((content) => {
      content.toxins[0]!.structureAssets[0]!.citationId = 'missing-structure-source';
      content.media[0]!.citationId = 'missing-media-source';
      content.geography[0]!.sourceAudit.citationIds = ['missing-geography-source'];
      content.organisms[0]!.evidence.citationIds.push('missing-organism-source');
    });
    expect(issues.filter((issue) => issue.code === 'invalid_reference')).toHaveLength(4);
  });

  it('audits all four geography evidence-reference surfaces', () => {
    const issues = issuesAfter((content) => {
      const geography = content.geography[0]!;
      geography.sourceAudit.evidenceIds = ['missing-audit-evidence'];
      geography.distribution!.nativeEvidenceIds = ['missing-native-evidence'];
      geography.distribution!.nativeScopes![0]!.evidenceIds = ['missing-scope-evidence'];
      geography.distribution!.sourceRanges = [{ layerType: 'native', geometryAssetPath: '/test.geojson', evidenceIds: ['missing-polygon-evidence'], confidence: 'low' }];
    });
    expect(issues.filter((issue) => issue.code === 'invalid_reference')).toHaveLength(4);
  });

  it('rejects orphan materials, featured toxins with wrong owners, and unknown subjects', () => {
    const issues = issuesAfter((content) => {
      content.toxicMaterials[0]!.organismSlug = 'missing-organism';
      content.toxicMaterials[0]!.featuredToxinSlug = 'missing-toxin';
      content.toxins[0]!.toxicMaterialId = 'missing-material';
      content.mechanisms[0]!.subject.slug = 'missing-subject';
    });
    expect(issues.filter((issue) => issue.code === 'invalid_reference')).toHaveLength(4);
  });

  it.each(['internal_only', 'editorial_with_public_citation', 'no_citations', 'review_label_only'])(
    'rejects unsupported scientific claims: %s', (scenario) => {
      const issues = issuesAfter((content) => {
        const evidence = content.toxins[0]!.molecularEntity.evidence;
        if (scenario === 'editorial_with_public_citation') evidence.evidenceType = 'editorial_normalization';
        else evidence.citationIds = scenario === 'no_citations' ? [] : ['cit-editorial-placeholder'];
        if (scenario === 'review_label_only') {
          evidence.reviewStatus = 'reviewed';
          evidence.reviewedAt = '2026-09-08';
        }
      });
      expect(issues.filter((issue) => issue.code === 'unsupported_claim')).toHaveLength(1);
    },
  );

  it('allows explicit uncertainty but not hidden notes or a declaration attached to positive properties', () => {
    const content = fixture();
    expect(auditContentGraph(content).summary.explicitUncertaintyClaims).toBe(1);
    const target = content.toxins[0]!.targets[0]!;
    target.evidence.publicUncertaintyStatement = 'Not the displayed claim';
    expect(auditContentGraph(content).issues.map((issue) => issue.code)).toEqual(['invalid_uncertainty', 'unsupported_claim']);
    const identity = content.toxins[0]!.molecularEntity;
    identity.evidence.evidenceType = 'editorial_normalization';
    identity.evidence.publicUncertaintyStatement = 'Unknown';
    expect(auditContentGraph(content).issues.filter((issue) => issue.code === 'unsupported_claim')).toHaveLength(2);
  });

  it('reports rows, unique sources, cited sources, claim support, and review separately', () => {
    const content = fixture();
    const before = auditContentGraph(content).summary;
    const duplicate = structuredClone(content.citations.find((entry) => entry.url)!);
    duplicate.id = 'duplicate-source-new-id';
    duplicate.slug = 'duplicate-source-new-slug';
    duplicate.aliases = [];
    content.citations.push(duplicate);
    const evidence = content.toxins[0]!.evidence;
    evidence.reviewStatus = 'reviewed';
    evidence.reviewedAt = '2026-09-08';
    const after = auditContentGraph(content).summary;
    expect(after.sourceRows).toBe(before.sourceRows + 1);
    expect(after.uniqueSources).toBe(before.uniqueSources);
    expect(after.citedSources).toBe(before.citedSources);
    expect(after.unsupportedClaims).toBe(0);
    expect(after.reviewedClaims).toBe(1);
    delete evidence.reviewedAt;
    expect(auditContentGraph(content).issues.some((issue) => issue.code === 'invalid_review')).toBe(true);
  });

  it('accepts the complete authored graph without silently upgrading evidence', () => {
    const report = auditContentGraph(getContentRecords());
    expect(report.issues).toEqual([]);
    expect(report.claims.filter((claim) => claim.support === 'unsupported').map((claim) => claim.evidenceId).sort())
      .toEqual([]);
    expect(report.summary.reviewedClaims).toBe(0);
  });
});

describe('complete static route inventory', () => {
  it('plans raw atlas and source routes without asserting draft routes are public', () => {
    const routes = buildRouteInventory(getContentRecords());
    expect(routes).toEqual(expect.arrayContaining(['/404', '/atlas', '/explore', '/atlas/solenopsis-invicta',
      '/sources/australian-museum-redback', '/sources/australian-museum-redback-spider']));
    for (const source of getAllCitations().filter((entry) => entry.visibility === 'internal')) {
      expect(routes).not.toContain(`/sources/${source.slug}`);
    }
    expect(new Set(routes).size).toBe(routes.length);
  });

  it('keeps duplicate routes detectable and rejects unsafe path segments', () => {
    const content = fixture();
    content.organisms.push(structuredClone(content.organisms[0]!));
    const routes = buildRouteInventory(content);
    expect(routes.filter((route) => route === '/atlas/solenopsis-invicta')).toHaveLength(2);
    expect(compareBuiltRoutes(routes, routes).collisions).toContain('/atlas/solenopsis-invicta');
    content.citations[0]!.slug = '../atlas';
    expect(auditContentGraph(content).issues.some((issue) => issue.code === 'invalid_slug')).toBe(true);
  });

  it('rejects missing and unexpected HTML pages instead of only checking planned routes', () => {
    expect(compareBuiltRoutes(['/', '/atlas/fire-ant'], ['/', '/unexpected']))
      .toEqual({ missing: ['/atlas/fire-ant'], unexpected: ['/unexpected'], collisions: [] });
    expect(compareBuiltRoutes(getAllRoutes(), getAllRoutes()))
      .toEqual({ missing: [], unexpected: [], collisions: [] });
  });
});