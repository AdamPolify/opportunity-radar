import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const STATE_PATH = path.join(process.cwd(), 'data', 'state.json');

export async function loadState() {
  try {
    const raw = await readFile(STATE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { seen: {}, lastRunAt: null, runCount: 0 };
    }
    throw err;
  }
}

export async function saveState(state) {
  await mkdir(path.dirname(STATE_PATH), { recursive: true });
  // Deliberately no cap/trim on seen-id lists: some sources (e.g. the
  // OpenAI news RSS feed) return their full historical archive on every
  // fetch, not just recent items, so any trim risks discarding an entry
  // that's still present in the feed -- which makes it look "new" again on
  // a later run. A few thousand 16-char hashes per source is a small price
  // (low hundreds of KB) for correctness.
  await writeFile(STATE_PATH, JSON.stringify(state, null, 2) + '\n', 'utf-8');
}

export function isSeen(state, sourceId, entryId) {
  return (state.seen[sourceId] ?? []).includes(entryId);
}

export function markSeen(state, sourceId, entryId) {
  if (!state.seen[sourceId]) state.seen[sourceId] = [];
  if (!state.seen[sourceId].includes(entryId)) {
    state.seen[sourceId].push(entryId);
  }
}
