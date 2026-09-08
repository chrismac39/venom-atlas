import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'js-yaml';
import { getContentRecords } from '../apps/web/src/lib/content';

type GeographySource = {
  organismSlug?: string;
  sourceAudit?: {
    decision?: string;
    precision?: string;
    evidenceIds?: string[];
    citationIds?: string[];
    note?: string;
  };
};

type CitationFile = { citations?: Array<{ id?: string }> };

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const geographyRoot = path.join(repoRoot, 'content-source', 'geography');
const citationRoot = path.join(repoRoot, 'content-source', 'citations');
const expectedSlugs = new Set(getContentRecords().organisms.map((entry) => entry.slug));
const sourceSlugs = new Set<string>();
const citationIds = new Set<string>();

for (const fileName of readdirSync(citationRoot).filter((name) => name.endsWith('.yaml'))) {
  const citationFile = load(readFileSync(path.join(citationRoot, fileName), 'utf8')) as CitationFile;
  for (const citation of citationFile.citations ?? []) {
    if (citation.id) {
      citationIds.add(citation.id);
    }
  }
}

for (const fileName of readdirSync(geographyRoot).filter((name) => name.endsWith('.yaml'))) {
  const source = load(readFileSync(path.join(geographyRoot, fileName), 'utf8')) as GeographySource;
  const slug = source.organismSlug;
  const audit = source.sourceAudit;
  if (!slug || !audit) {
    throw new Error(`Geography source ${fileName} is missing organismSlug or sourceAudit.`);
  }
  if (sourceSlugs.has(slug)) {
    throw new Error(`Duplicate geography source audit: ${slug}`);
  }
  sourceSlugs.add(slug);
  if (!audit.decision || !audit.precision || !audit.note || !audit.evidenceIds?.length || !audit.citationIds?.length) {
    throw new Error(`Geography source audit is incomplete: ${slug}`);
  }
  for (const citationId of audit.citationIds) {
    if (!citationIds.has(citationId)) {
      throw new Error(`Geography source audit ${slug} references unknown citation: ${citationId}`);
    }
  }
}

for (const slug of expectedSlugs) {
  if (!sourceSlugs.has(slug)) {
    throw new Error(`Organism is missing a geography source audit: ${slug}`);
  }
}
for (const slug of sourceSlugs) {
  if (!expectedSlugs.has(slug)) {
    throw new Error(`Geography source audit has no organism record: ${slug}`);
  }
}

console.log(`Geography source validation passed (${sourceSlugs.size} organism audits).`);