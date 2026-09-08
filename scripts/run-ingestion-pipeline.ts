import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { getPublicationReadinessReport } from '../apps/web/src/lib/content';
import { citationIdentifierKey, parseCitationMetadata, type MetadataCache } from './citation-metadata-import';
import { extractAssertion, type RetrievedSourceCache } from './research-extraction';
import { buildIngestionImpactReport, type IngestionStageResult } from './ingestion-pipeline';

const manifestSchema = z.object({
  jobs: z.array(z.object({
    subject: z.string(), metadataCache: z.string(), sourceCache: z.string(), responseCache: z.string(),
    extraction: z.object({
      assertionId: z.string(), claimType: z.enum(['property', 'clinical']),
      subjectKind: z.enum(['organism_exposure', 'whole_material', 'isolated_compound']), subjectSlug: z.string(),
      model: z.string(), promptVersion: z.string(), generatedAt: z.string(),
    }),
  })).min(1),
});

const value = (name: string) => process.argv.find((entry) => entry.startsWith(`--${name}=`))?.slice(name.length + 3);
const manifestPath = path.resolve(value('manifest') ?? 'content-source/import-manifests/fire-ant-clinical.json');
const outputPath = value('output');
const publishRequested = process.argv.includes('--publish');
const stages: IngestionStageResult[] = [];

const main = async () => {
  const manifest = manifestSchema.parse(JSON.parse(readFileSync(manifestPath, 'utf8')));
  stages.push({ stage: 'discover', status: 'passed', detail: `${manifest.jobs.length} ingestion job(s) discovered.` });
  const identifiers: string[] = [];
  const claims: Array<{ id: string; status: 'passed' | 'quarantined' }> = [];

  for (const job of manifest.jobs) {
    try {
      const cache = JSON.parse(readFileSync(path.resolve(job.metadataCache), 'utf8')) as MetadataCache;
      parseCitationMetadata(cache);
      identifiers.push(citationIdentifierKey(cache.identifier));
    } catch (error) {
      stages.push({ stage: 'retrieve_cache', status: 'quarantined', detail: error instanceof Error ? error.message : String(error) });
      claims.push({ id: job.extraction.assertionId, status: 'quarantined' });
      continue;
    }
    const source = JSON.parse(readFileSync(path.resolve(job.sourceCache), 'utf8')) as RetrievedSourceCache;
    const response = readFileSync(path.resolve(job.responseCache), 'utf8');
    const extracted = await extractAssertion(source, job.extraction, async () => response);
    claims.push({ id: job.extraction.assertionId, status: extracted.status });
    if (extracted.status === 'quarantined') {
      stages.push({ stage: 'extract', status: 'quarantined', detail: extracted.reason });
    }
  }
  if (!stages.some((stage) => stage.stage === 'retrieve_cache')) stages.push({ stage: 'retrieve_cache', status: 'passed', detail: 'Metadata caches verified.' });
  if (!stages.some((stage) => stage.stage === 'extract')) stages.push({ stage: 'extract', status: 'passed', detail: 'Cached model outputs validated.' });
  stages.push({ stage: 'summarize', status: claims.every((claim) => claim.status === 'passed') ? 'passed' : 'quarantined', detail: 'Structured claim summaries produced.' });

  try {
    for (const validator of ['validate-content', 'validate-geography-sources', 'validate-media', 'validate-structures']) {
      execFileSync(process.execPath, ['--import', 'tsx', path.resolve(`scripts/${validator}.ts`)], { stdio: 'inherit' });
    }
    stages.push({ stage: 'validate', status: 'passed', detail: 'Content validation passed.' });
  } catch {
    stages.push({ stage: 'validate', status: 'failed', detail: 'Content validation failed.' });
  }
  const readiness = getPublicationReadinessReport();
  const subjects = [...new Set(manifest.jobs.map((job) => job.subject))];
  const readinessBySubject = Object.fromEntries(subjects.map((subject) => [subject, readiness.find((entry) => entry.slug === subject)?.eligible === true]));
  stages.push({ stage: 'readiness', status: Object.values(readinessBySubject).every(Boolean) ? 'passed' : 'failed', detail: 'Four-section publication readiness evaluated.' });
  const report = buildIngestionImpactReport({ subjects, identifiers, claims, stages, readinessBySubject, publishRequested });
  if (report.publication.performed) {
    execFileSync(process.execPath, ['--import', 'tsx', path.resolve('scripts/prepare-publication.ts')], { stdio: 'inherit' });
  }
  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  if (outputPath) writeFileSync(path.resolve(outputPath), serialized); else process.stdout.write(serialized);
  if (!report.publication.allowed) process.exitCode = 1;
};

void main();