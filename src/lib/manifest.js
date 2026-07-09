import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const MANIFEST_PATH = path.join(process.cwd(), 'data', 'manifest.json');

export async function loadManifest() {
  try {
    const raw = await readFile(MANIFEST_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return { digests: [] };
    throw err;
  }
}

export async function appendToManifest({ file, digest }) {
  const manifest = await loadManifest();
  // If a run happens twice on the same day, the second run overwrites the
  // same digests/<date>.json file -- replace the existing manifest entry
  // instead of adding a duplicate that points at the same (now-different) file.
  manifest.digests = manifest.digests.filter((d) => d.file !== file);
  manifest.digests.unshift({
    file,
    generatedAt: digest.generatedAt,
    isBootstrap: digest.isBootstrap,
    weekSummary: digest.weekSummary,
    opportunityCount: digest.opportunities.length,
    filteredCount: digest.filtered.length,
  });
  await mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
  return manifest;
}
