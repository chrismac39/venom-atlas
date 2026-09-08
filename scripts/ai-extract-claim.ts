import { readFileSync } from 'node:fs';
import path from 'node:path';
import { extractAssertion, type RetrievedSourceCache } from './research-extraction';

const argument = (name: string) => process.argv.find((entry) => entry.startsWith(`--${name}=`))?.slice(name.length + 3);
const sourcePath = path.resolve(argument('source-cache') ?? 'content-source/import-cache/retrieved/pmid-29261949.json');
const responsePath = path.resolve(argument('response-cache') ?? 'content-source/import-cache/extractions/claim-fire-ant-systemic-allergy.json');
const source = JSON.parse(readFileSync(sourcePath, 'utf8')) as RetrievedSourceCache;
const response = readFileSync(responsePath, 'utf8');

const main = async () => {
  const result = await extractAssertion(source, {
    assertionId: argument('assertion-id') ?? 'claim-fire-ant-systemic-allergy',
    claimType: 'clinical', subjectKind: 'organism_exposure', subjectSlug: argument('subject') ?? 'solenopsis-invicta',
    model: argument('model') ?? 'cached-model-output', promptVersion: argument('prompt-version') ?? 'milestone-2-clinical-assertion-v1',
    generatedAt: argument('generated-at') ?? '2026-09-08T00:00:00Z',
  }, async () => response);
  console.log(JSON.stringify({ notice: 'Retrieved content was treated as untrusted data. Failed output is quarantined.', result }, null, 2));
  if (result.status === 'quarantined') process.exitCode = 1;
};

void main();