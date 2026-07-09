import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { loadState, saveState } from './lib/state.js';
import { collectNewEntries, markAllSeen, buildDigest } from './lib/digest.js';
import { appendToManifest } from './lib/manifest.js';
import { renderEmailHtml, renderEmailText, renderEmailSubject } from './lib/render.js';

const DRY_RUN = process.env.DRY_RUN === '1';

async function main() {
  const state = await loadState();
  const isBootstrap = state.runCount === 0;

  console.log(isBootstrap ? 'First run: establishing baseline...' : 'Checking sources for new entries...');

  const { newEntries, errors } = await collectNewEntries(state);
  console.log(`Found ${newEntries.length} new entries across all sources. ${errors.length} source(s) failed to fetch.`);
  for (const e of errors) console.warn(`  - ${e.source}: ${e.message}`);

  const digest = await buildDigest({ newEntries, errors, isBootstrap });

  markAllSeen(state, newEntries);
  state.runCount = (state.runCount ?? 0) + 1;
  state.lastRunAt = digest.generatedAt;

  const dateSlug = digest.generatedAt.slice(0, 10);
  const filename = `${dateSlug}.json`;
  const digestPath = path.join(process.cwd(), 'data', 'digests', DRY_RUN ? `dryrun-${filename}` : filename);

  await mkdir(path.dirname(digestPath), { recursive: true });
  await writeFile(digestPath, JSON.stringify(digest, null, 2) + '\n', 'utf-8');
  console.log(`Wrote digest to ${digestPath}`);

  await writeFile(path.join(process.cwd(), 'data', 'latest-email.html'), renderEmailHtml(digest), 'utf-8');
  await writeFile(path.join(process.cwd(), 'data', 'latest-email.txt'), renderEmailText(digest), 'utf-8');
  // Trailing newline matters: the workflow's `cat file` + `echo "EOF"` heredoc
  // trick needs the EOF delimiter on its own line, which requires the file
  // to already end in a newline.
  await writeFile(path.join(process.cwd(), 'data', 'latest-subject.txt'), renderEmailSubject(digest) + '\n', 'utf-8');

  if (!DRY_RUN) {
    await appendToManifest({ file: `digests/${filename}`, digest });
    await saveState(state);
  } else {
    console.log('DRY_RUN=1 set — state.json and manifest.json were not updated.');
  }

  console.log('\n' + digest.weekSummary);
  console.log(`Opportunities: ${digest.opportunities.length} | Filtered as routine: ${digest.filtered.length}`);
}

main().catch((err) => {
  console.error('Opportunity Radar run failed:', err);
  process.exit(1);
});
