import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// A missing/error-shaped report is not a clean audit. Keep the existing
// production high/critical policy; distinguish findings from execution failure.
export function evaluateAudit(report, status) {
  if (!Number.isInteger(status) || status < 0 || status > 255) {
    throw new Error('Invalid npm audit exit status');
  }
  if (!report || typeof report !== 'object' || Array.isArray(report) || 'error' in report) {
    throw new Error('npm audit did not return a successful report');
  }
  const counts = report.metadata?.vulnerabilities;
  const severities = ['info', 'low', 'moderate', 'high', 'critical', 'total'];
  if (
    !counts ||
    typeof counts !== 'object' ||
    severities.some((key) => !Number.isSafeInteger(counts[key]) || counts[key] < 0)
  ) {
    throw new Error('npm audit report has missing or invalid vulnerability counts');
  }
  if (severities.slice(0, -1).reduce((sum, key) => sum + counts[key], 0) !== counts.total) {
    throw new Error('npm audit vulnerability counts are inconsistent');
  }
  const blocked = counts.high + counts.critical;
  if (blocked > 0) throw new Error(`High/critical vulnerabilities: ${blocked}`);
  if (status !== 0) throw new Error(`npm audit execution failed (exit ${status})`);
  return 'Audit passed: no high/critical production vulnerabilities';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [path, status] = process.argv.slice(2);
    if (!path || !/^\d+$/.test(status || '')) {
      throw new Error('Usage: node scripts/check-npm-audit.mjs REPORT EXIT_STATUS');
    }
    console.log(evaluateAudit(JSON.parse(readFileSync(path, 'utf8')), Number(status)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Audit verification failed');
    process.exitCode = 1;
  }
}
