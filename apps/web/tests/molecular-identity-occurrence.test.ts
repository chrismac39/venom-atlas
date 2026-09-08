// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { compoundOccurrenceSchema, molecularIdentitySchema } from '@venom-atlas/schemas';

const evidence = {
  id: 'evidence-fixture', level: 'primary' as const, source: 'Fixture', citationIds: ['cit-fixture'],
  confidence: 'high' as const, evidenceType: 'experimental' as const,
};

describe('molecular identity and biological occurrence', () => {
  it('associates one molecular identity with multiple organisms without duplication', () => {
    const occurrences = [
      { id: 'occurrence-one', molecularEntityId: 'molecule-one', organismSlug: 'organism-one', toxicMaterialId: 'material-one' },
      { id: 'occurrence-two', molecularEntityId: 'molecule-one', organismSlug: 'organism-two', toxicMaterialId: 'material-two' },
    ].map((entry) => compoundOccurrenceSchema.parse({
      ...entry, relationship: 'confirmed_component', summary: 'Detected in source-backed material.', evidence,
    }));
    expect(new Set(occurrences.map((entry) => entry.molecularEntityId))).toEqual(new Set(['molecule-one']));
    expect(new Set(occurrences.map((entry) => entry.organismSlug)).size).toBe(2);
  });

  it.each([
    { kind: 'compound_group', groupName: 'Solenopsins' },
    { kind: 'exact_stereoisomer', stereochemistry: '(2S,6S)', isomericSmiles: 'C[C@@H]1CCCC[C@H]1CCCCCCCCCCC', inchi: 'InChI=1S/example', inchiKey: 'ABCDEFGHIJKLMN-ABCDEFGHIJ-A' },
    { kind: 'salt', parentMolecularEntityId: 'parent', saltForm: 'hydrochloride' },
    { kind: 'protonation_state', parentMolecularEntityId: 'parent', formalCharge: 1 },
    { kind: 'protein_isoform', accession: 'P12345', isoform: '2' },
    { kind: 'protein_serotype', accession: 'P12345', serotype: 'A' },
    { kind: 'biological_mixture', components: ['component-one', 'component-two'] },
  ])('accepts distinct $kind identities', (identity) => {
    expect(molecularIdentitySchema.parse(identity)).toEqual(identity);
  });
});