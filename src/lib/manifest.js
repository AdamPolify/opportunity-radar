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
