import { createHash } from 'node:crypto';
import type { ClaimAssertion } from '@venom-atlas/domain';

export interface PubChemProperty {
  CID: number;
  Title: string;
  MolecularFormula: string;
  MolecularWeight: string;
  SMILES: string;
  InChI: string;
  InChIKey: string;
}

export interface PubChemCache {
  provider: 'PubChem PUG REST';
  endpoint: string;
  retrievedAt: string;
  sourceVersionDate: string;
  payloadChecksum: string;
  payload: { PropertyTable: { Properties: PubChemProperty[] } };
}

export const checksumPubChemPayload = (payload: PubChemCache['payload']): string =>
  `sha256:${createHash('sha256').update(JSON.stringify(payload)).digest('hex')}`;

export const buildPubChemMolecularWeightAssertion = (
  cache: PubChemCache,
  expected: { cid: number; inchiKey: string; subjectSlug: string },
): ClaimAssertion => {
  if (checksumPubChemPayload(cache.payload) !== cache.payloadChecksum) {
    throw new Error('PubChem cache checksum does not match its payload.');
  }
  const properties = cache.payload.PropertyTable.Properties;
  if (properties.length !== 1) {
    throw new Error(`Ambiguous PubChem response: expected one identity, received ${properties.length}.`);
  }
  const property = properties[0]!;
  if (property.CID !== expected.cid || property.InChIKey !== expected.inchiKey) {
    throw new Error(`PubChem identity mismatch for CID ${expected.cid}; refusing to guess.`);
  }
  const molecularWeight = Number(property.MolecularWeight);
  if (!Number.isFinite(molecularWeight) || molecularWeight <= 0) {
    throw new Error(`Invalid PubChem molecular weight for CID ${expected.cid}.`);
  }

  return {
    id: `claim-${expected.subjectSlug}-molecular-weight`,
    claimType: 'property',
    label: 'Molecular weight',
    value: { kind: 'number', amount: molecularWeight, unit: 'g/mol' },
    scope: { subjectKind: 'isolated_compound', subjectSlug: expected.subjectSlug, property: 'molecular_weight' },
    conditions: [],
    applicability: {
      evidenceContext: 'inference',
      model: 'PubChem computed property',
      summary: `Computed descriptor for PubChem CID ${property.CID}, not an experimental measurement.`,
    },
    sourceLocators: [{
      citationId: `cit-pubchem-${expected.subjectSlug}`,
      locator: 'Chemical and Physical Properties > Computed Properties > Molecular Weight',
      sourceIdentifier: `CID ${property.CID}`,
      sourceVersionDate: cache.sourceVersionDate,
    }],
    provenance: {
      method: 'pubchem_import', methodVersion: 'pubchem-pug-v1', retrievedAt: cache.retrievedAt,
      checkedAt: cache.retrievedAt, sourceChecksum: cache.payloadChecksum,
    },
    validation: {
      status: 'passed', checkedAt: cache.retrievedAt,
      checks: ['cache_checksum_match', 'single_result', 'exact_cid_match', 'exact_inchi_key_match', 'unit_present'],
    },
  };
};

export type PubChemPropertyName = 'MolecularWeight' | 'MolecularFormula' | 'SMILES' | 'InChI' | 'InChIKey';

export const buildPubChemPropertyAssertions = (
  cache: PubChemCache,
  expected: { cid: number; inchiKey: string; subjectSlug: string },
  propertyNames: PubChemPropertyName[],
): ClaimAssertion[] => {
  const molecularWeight = buildPubChemMolecularWeightAssertion(cache, expected);
  const property = cache.payload.PropertyTable.Properties[0]!;
  const values: Record<Exclude<PubChemPropertyName, 'MolecularWeight'>, string> = {
    MolecularFormula: property.MolecularFormula,
    SMILES: property.SMILES,
    InChI: property.InChI,
    InChIKey: property.InChIKey,
  };
  return [...new Set(propertyNames)].map((name) => {
    if (name === 'MolecularWeight') return molecularWeight;
    const value = values[name];
    if (!value?.trim()) throw new Error(`PubChem ${name} is missing for CID ${expected.cid}.`);
    return {
      ...molecularWeight,
      id: `claim-${expected.subjectSlug}-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`).replace(/^-/, '')}`,
      label: name.replace(/([a-z])([A-Z])/g, '$1 $2'),
      value: { kind: 'text', text: value },
      scope: { ...molecularWeight.scope, property: name },
      sourceLocators: molecularWeight.sourceLocators.map((locator) => ({
        ...locator,
        locator: `Names and Identifiers > Computed Descriptors > ${name}`,
      })),
      validation: { ...molecularWeight.validation, checks: [...molecularWeight.validation.checks, 'property_present'] },
    };
  });
};