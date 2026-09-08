// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildPubChemMolecularWeightAssertion, buildPubChemPropertyAssertions, checksumPubChemPayload, type PubChemCache } from '../../../scripts/pubchem-import';

const cache = (): PubChemCache => {
  const payload = { PropertyTable: { Properties: [{
    CID: 107941, Title: 'Solenopsin A', MolecularFormula: 'C17H35N', MolecularWeight: '253.5',
    SMILES: 'fixture', InChI: 'fixture', InChIKey: 'AYJGABFBAYKWDX-IRXDYDNUSA-N',
  }] } };
  return {
    provider: 'PubChem PUG REST', endpoint: 'https://example.org/pubchem',
    retrievedAt: '2026-09-08T00:00:00Z', sourceVersionDate: '2025-04-14',
    payloadChecksum: checksumPubChemPayload(payload), payload,
  };
};

describe('bounded PubChem property import', () => {
  it('builds a source-located property assertion from one exact identity', () => {
    const assertion = buildPubChemMolecularWeightAssertion(cache(), {
      cid: 107941, inchiKey: 'AYJGABFBAYKWDX-IRXDYDNUSA-N', subjectSlug: 'solenopsin-a',
    });
    expect(assertion.value).toEqual({ kind: 'number', amount: 253.5, unit: 'g/mol' });
    expect(assertion.validation.status).toBe('passed');
  });

  it('refuses ambiguous, mismatched, and modified cache records', () => {
    const ambiguous = cache();
    ambiguous.payload.PropertyTable.Properties.push({ ...ambiguous.payload.PropertyTable.Properties[0]!, CID: 2 });
    ambiguous.payloadChecksum = checksumPubChemPayload(ambiguous.payload);
    expect(() => buildPubChemMolecularWeightAssertion(ambiguous, { cid: 107941, inchiKey: 'AYJGABFBAYKWDX-IRXDYDNUSA-N', subjectSlug: 'solenopsin-a' })).toThrow('Ambiguous');
    expect(() => buildPubChemMolecularWeightAssertion(cache(), { cid: 107941, inchiKey: 'wrong', subjectSlug: 'solenopsin-a' })).toThrow('refusing to guess');
    const modified = cache();
    modified.payload.PropertyTable.Properties[0]!.MolecularWeight = '999';
    expect(() => buildPubChemMolecularWeightAssertion(modified, { cid: 107941, inchiKey: 'AYJGABFBAYKWDX-IRXDYDNUSA-N', subjectSlug: 'solenopsin-a' })).toThrow('checksum');
  });

  it('imports a bounded identity property set without relaxing exact identity checks', () => {
    const assertions = buildPubChemPropertyAssertions(cache(), {
      cid: 107941, inchiKey: 'AYJGABFBAYKWDX-IRXDYDNUSA-N', subjectSlug: 'solenopsin-a',
    }, ['MolecularWeight', 'MolecularFormula', 'InChI', 'InChIKey', 'SMILES']);
    expect(assertions).toHaveLength(5);
    expect(assertions.find((entry) => entry.scope.property === 'InChIKey')?.value).toEqual({
      kind: 'text', text: 'AYJGABFBAYKWDX-IRXDYDNUSA-N',
    });
  });
});