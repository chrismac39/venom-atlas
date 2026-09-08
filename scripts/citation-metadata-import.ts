import { createHash } from 'node:crypto';

export type CitationIdentifier =
  | { kind: 'doi'; value: string }
  | { kind: 'pmid'; value: string }
  | { kind: 'accession'; value: string };

export interface MetadataCache {
  provider: 'Crossref' | 'NCBI PubMed' | 'UniProt';
  identifier: CitationIdentifier;
  endpoint: string;
  retrievedAt: string;
  payloadChecksum: string;
  payload: unknown;
}

export interface CitationMetadataCandidate {
  identifier: CitationIdentifier;
  title: string;
  authors: string[];
  publicationYear?: number | undefined;
  url: string;
  provider: MetadataCache['provider'];
  retrievedAt: string;
  payloadChecksum: string;
}

export interface AuthoredCitationMetadata {
  id: string;
  title: string;
  authors?: string[] | undefined;
  publicationYear?: number | undefined;
  doi?: string | undefined;
  pmid?: string | undefined;
  accession?: string | undefined;
  url?: string | undefined;
}

export interface CitationMetadataReview {
  matchId?: string | undefined;
  duplicateIds: string[];
  changes: Array<{ field: 'title' | 'authors' | 'publicationYear' | 'url'; authored: unknown; candidate: unknown }>;
}

export const normalizeCitationIdentifier = (identifier: CitationIdentifier): CitationIdentifier => ({
  kind: identifier.kind,
  value: identifier.kind === 'doi'
    ? identifier.value.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').trim().toLowerCase()
    : identifier.kind === 'pmid' ? identifier.value.trim() : identifier.value.trim().toUpperCase(),
});

export const citationIdentifierKey = (identifier: CitationIdentifier): string => {
  const normalized = normalizeCitationIdentifier(identifier);
  return `${normalized.kind}:${normalized.value}`;
};

export const citationMetadataRequest = (identifier: CitationIdentifier) => {
  const normalized = normalizeCitationIdentifier(identifier);
  if (normalized.kind === 'doi') return {
    provider: 'Crossref' as const,
    endpoint: `https://api.crossref.org/works/${encodeURIComponent(normalized.value)}`,
  };
  if (normalized.kind === 'pmid') return {
    provider: 'NCBI PubMed' as const,
    endpoint: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${normalized.value}&retmode=json`,
  };
  return {
    provider: 'UniProt' as const,
    endpoint: `https://rest.uniprot.org/uniprotkb/${encodeURIComponent(normalized.value)}.json`,
  };
};

export const checksumMetadataPayload = (payload: unknown): string =>
  `sha256:${createHash('sha256').update(JSON.stringify(payload)).digest('hex')}`;

const text = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Metadata payload is missing ${field}.`);
  return value.trim();
};

export const parseCitationMetadata = (cache: MetadataCache): CitationMetadataCandidate => {
  if (checksumMetadataPayload(cache.payload) !== cache.payloadChecksum) throw new Error('Metadata cache checksum mismatch.');
  const payload = cache.payload as Record<string, any>;
  const identifier = normalizeCitationIdentifier(cache.identifier);
  if (identifier.kind === 'doi') {
    const message = payload.message;
    const title = text(message?.title?.[0], 'Crossref title');
    return {
      identifier, title,
      authors: (message.author ?? []).map((author: any) => [author.given, author.family].filter(Boolean).join(' ')).filter(Boolean),
      ...(message.published?.['date-parts']?.[0]?.[0] ? { publicationYear: message.published['date-parts'][0][0] } : {}),
      url: text(message.URL, 'Crossref URL'), provider: cache.provider,
      retrievedAt: cache.retrievedAt, payloadChecksum: cache.payloadChecksum,
    };
  }
  if (identifier.kind === 'pmid') {
    const result = payload.result?.[identifier.value];
    const year = Number.parseInt(String(result?.docdate ?? result?.sortpubdate ?? result?.pubdate ?? ''), 10);
    return {
      identifier, title: text(result?.title, 'PubMed title'),
      authors: (result?.authors ?? []).map((author: any) => author.name).filter(Boolean),
      ...(Number.isInteger(year) ? { publicationYear: year } : {}),
      url: `https://pubmed.ncbi.nlm.nih.gov/${identifier.value}/`, provider: cache.provider,
      retrievedAt: cache.retrievedAt, payloadChecksum: cache.payloadChecksum,
    };
  }
  const protein = payload.proteinDescription;
  return {
    identifier,
    title: text(protein?.recommendedName?.fullName?.value ?? protein?.submissionNames?.[0]?.fullName?.value, 'UniProt protein name'),
    authors: [],
    url: `https://rest.uniprot.org/uniprotkb/${identifier.value}`, provider: cache.provider,
    retrievedAt: cache.retrievedAt, payloadChecksum: cache.payloadChecksum,
  };
};

export const assertUniqueCitationIdentifiers = (identifiers: CitationIdentifier[]): void => {
  const seen = new Set<string>();
  for (const identifier of identifiers) {
    const key = citationIdentifierKey(identifier);
    if (seen.has(key)) throw new Error(`Duplicate citation identifier: ${key}`);
    seen.add(key);
  }
};

export const retrieveMetadata = async (
  identifier: CitationIdentifier,
  fetcher: typeof fetch,
  retrievedAt = new Date().toISOString(),
): Promise<MetadataCache> => {
  const normalized = normalizeCitationIdentifier(identifier);
  const request = citationMetadataRequest(normalized);
  const response = await fetcher(request.endpoint, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`${request.provider} metadata request failed with HTTP ${response.status}.`);
  const payload: unknown = await response.json();
  return {
    provider: request.provider, identifier: normalized, endpoint: request.endpoint, retrievedAt,
    payloadChecksum: checksumMetadataPayload(payload), payload,
  };
};

export const reviewCitationMetadata = (
  candidate: CitationMetadataCandidate,
  authored: AuthoredCitationMetadata[],
): CitationMetadataReview => {
  const identifier = normalizeCitationIdentifier(candidate.identifier);
  const matches = authored.filter((citation) => {
    const value = identifier.kind === 'doi' ? citation.doi : identifier.kind === 'pmid' ? citation.pmid : citation.accession;
    return value ? citationIdentifierKey({ kind: identifier.kind, value }) === citationIdentifierKey(identifier) : false;
  });
  const match = matches[0];
  const changes: CitationMetadataReview['changes'] = [];
  if (match) {
    for (const field of ['title', 'authors', 'publicationYear', 'url'] as const) {
      const authoredValue = match[field];
      const candidateValue = candidate[field];
      if (JSON.stringify(authoredValue ?? null) !== JSON.stringify(candidateValue ?? null)) {
        changes.push({ field, authored: authoredValue ?? null, candidate: candidateValue ?? null });
      }
    }
  }
  return { ...(match ? { matchId: match.id } : {}), duplicateIds: matches.slice(1).map((citation) => citation.id), changes };
};