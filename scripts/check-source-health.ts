import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { getPublicCitations } from '../apps/web/src/lib/content';
import { checkSourceHealth } from './source-health';

const output = process.argv.find((entry) => entry.startsWith('--output='))?.slice('--output='.length);
const delayMs = Number(process.argv.find((entry) => entry.startsWith('--delay-ms='))?.slice('--delay-ms='.length) ?? 250);

const main = async () => {
  const results = [];
  for (const [index, citation] of getPublicCitations().entries()) {
    if (index) await new Promise((resolve) => setTimeout(resolve, delayMs));
    results.push(await checkSourceHealth(citation, fetch));
  }
  const report = JSON.stringify({
    generatedAt: new Date().toISOString(),
    notice: 'Standalone maintenance report; source health never runs during offline validation or builds.',
    summary: {
      checked: results.length,
      unhealthy: results.filter((entry) => !['healthy', 'redirect', 'unavailable'].includes(entry.url.status)).length,
      stale: results.filter((entry) => entry.stale).length,
      retracted: results.filter((entry) => entry.metadata.status === 'retracted').length,
      updated: results.filter((entry) => entry.metadata.status === 'updated').length,
    },
    results,
  }, null, 2);
  if (output) writeFileSync(path.resolve(output), `${report}\n`);
  else console.log(report);
};

void main();