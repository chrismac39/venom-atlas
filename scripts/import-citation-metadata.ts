import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  assertUniqueCitationIdentifiers, citationIdentifierKey, parseCitationMetadata, retrieveMetadata,
  reviewCitationMetadata, type CitationIdentifier, type MetadataCache,
} from './citation-metadata-import';
import { getAllCitations } from '../apps/web/src/lib/content';

const values = (name: string) => process.argv.filter((entry) => entry.startsWith(`--${name}=`))
  .flatMap((entry) => entry.slice(name.length + 3).split(/[\s,]+/).filter(Boolean));
const identifiers: CitationIdentifier[] = [
  ...values('doi').map((value) => ({ kind: 'doi' as const, value })),
  ...values('pmid').map((value) => ({ kind: 'pmid' as const, value })),
  ...values('accession').map((value) => ({ kind: 'accession' as const, value })),
];
const offline = process.argv.includes('--offline');
const delayMs = Number(values('delay-ms')[0] ?? 350);
const main = async () => {
  if (!identifiers.length) throw new Error('Provide --doi, --pmid, or --accession.');
  assertUniqueCitationIdentifiers(identifiers);

  const results = [];
  for (const [index, identifier] of identifiers.entries()) {
    const cachePath = path.resolve(`content-source/import-cache/citations/${citationIdentifierKey(identifier).replace(':', '-')}.json`);
    let cache: MetadataCache;
    if (existsSync(cachePath)) cache = JSON.parse(readFileSync(cachePath, 'utf8')) as MetadataCache;
    else {
      if (offline) throw new Error(`Missing offline metadata cache: ${cachePath}`);
      if (index > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
      cache = await retrieveMetadata(identifier, fetch);
      mkdirSync(path.dirname(cachePath), { recursive: true });
      writeFileSync(cachePath, `${JSON.stringify(cache, null, 2)}\n`);
    }
    const candidate = parseCitationMetadata(cache);
    results.push({ cachePath, candidate, review: reviewCitationMetadata(candidate, getAllCitations()) });
  }
  console.log(JSON.stringify({
    notice: 'Review candidates against authored citations. No content YAML was modified.', results,
  }, null, 2));
};

void main();