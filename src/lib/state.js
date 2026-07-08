import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const STATE_PATH = path.join(process.cwd(), 'data', 'state.json');
const MAX_SEEN_PER_SOURCE = 500; // cap so the state file doesn't grow forever

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
  // Trim each source's seen-id list to the most recent MAX_SEEN_PER_SOURCE
  // entries so this file stays small and diff-friendly in git.
  const trimmed = {
    ...state,
    seen: Object.fromEntries(
      Object.entries(state.seen).map(([sourceId, ids]) => [
        sourceId,
        ids.slice(-MAX_SEEN_PER_SOURCE),
      ])
    ),
  };
  await writeFile(STATE_PATH, JSON.stringify(trimmed, null, 2) + '\n', 'utf-8');
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
