// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import {
  assertUniqueCitationIdentifiers, checksumMetadataPayload, normalizeCitationIdentifier,
  parseCitationMetadata, retrieveMetadata, reviewCitationMetadata, type MetadataCache,
} from '../../../scripts/citation-metadata-import';

const pubmedCache = (): MetadataCache => {
  const payload = { result: { '29261949': {
    title: 'Fire Ant Bites.', docdate: '2023 Aug 7',
    authors: [{ name: 'Kruse B' }, { name: 'Anderson J' }, { name: 'Simon LV' }],
  } } };
  return {
    provider: 'NCBI PubMed', identifier: { kind: 'pmid', value: '29261949' },
    endpoint: 'https://example.org/pubmed', retrievedAt: '2026-09-08T00:00:00Z',
    payloadChecksum: checksumMetadataPayload(payload), payload,
  };
};

describe('citation metadata import', () => {
  it('normalizes identifiers, detects duplicates, and parses PubMed metadata', () => {
    expect(normalizeCitationIdentifier({ kind: 'doi', value: 'https://doi.org/10.1000/ABC' }).value).toBe('10.1000/abc');
    expect(() => assertUniqueCitationIdentifiers([
      { kind: 'doi', value: '10.1000/ABC' }, { kind: 'doi', value: 'https://doi.org/10.1000/abc' },
    ])).toThrow('Duplicate citation identifier');
    expect(parseCitationMetadata(pubmedCache())).toEqual(expect.objectContaining({
      title: 'Fire Ant Bites.', publicationYear: 2023, provider: 'NCBI PubMed',
    }));
  });

  it('rejects modified caches and preserves provider HTTP failures', async () => {
    const modified = pubmedCache();
    (modified.payload as any).result['29261949'].title = 'Modified';
    expect(() => parseCitationMetadata(modified)).toThrow('checksum');
    const fetcher = vi.fn(async () => new Response('{}', { status: 429 })) as unknown as typeof fetch;
    await expect(retrieveMetadata({ kind: 'pmid', value: '29261949' }, fetcher)).rejects.toThrow('HTTP 429');
  });

  it('parses Crossref and UniProt metadata and emits authored review diffs', () => {
    const crossrefPayload = { message: {
      title: ['Source title'], author: [{ given: 'Ada', family: 'Lovelace' }],
      published: { 'date-parts': [[2024, 2, 1]] }, URL: 'https://doi.org/10.1000/test',
    } };
    const crossref = parseCitationMetadata({
      provider: 'Crossref', identifier: { kind: 'doi', value: '10.1000/TEST' }, endpoint: 'crossref',
      retrievedAt: '2026-01-01T00:00:00Z', payloadChecksum: checksumMetadataPayload(crossrefPayload), payload: crossrefPayload,
    });
    expect(crossref).toEqual(expect.objectContaining({ title: 'Source title', authors: ['Ada Lovelace'], publicationYear: 2024 }));
    expect(reviewCitationMetadata(crossref, [
      { id: 'cit-one', title: 'Old title', doi: 'https://doi.org/10.1000/test', authors: ['A. Lovelace'], publicationYear: 2023 },
      { id: 'cit-duplicate', title: 'Duplicate', doi: '10.1000/TEST' },
    ])).toEqual(expect.objectContaining({
      matchId: 'cit-one', duplicateIds: ['cit-duplicate'],
      changes: expect.arrayContaining([expect.objectContaining({ field: 'title', candidate: 'Source title' })]),
    }));

    const uniprotPayload = { proteinDescription: { recommendedName: { fullName: { value: 'Alpha toxin' } } } };
    expect(parseCitationMetadata({
      provider: 'UniProt', identifier: { kind: 'accession', value: 'p12345' }, endpoint: 'uniprot',
      retrievedAt: '2026-01-01T00:00:00Z', payloadChecksum: checksumMetadataPayload(uniprotPayload), payload: uniprotPayload,
    })).toEqual(expect.objectContaining({ title: 'Alpha toxin', url: expect.stringContaining('P12345') }));
  });
});