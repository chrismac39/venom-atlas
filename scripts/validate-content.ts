import { getContentRecords } from '../apps/web/src/lib/content';
import { auditContentGraph } from '../apps/web/src/lib/content-graph-audit';

const report = auditContentGraph(getContentRecords());
if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('Content graph audit:', JSON.stringify(report.summary, null, 2));
  for (const issue of report.issues) console.error(`[${issue.code}] ${issue.path}: ${issue.message}`);
  console.log(report.issues.length === 0 ? 'Content validation passed.' : `Content validation rejected ${report.issues.length} issue(s).`);
}
if (report.issues.length > 0) process.exitCode = 1;
