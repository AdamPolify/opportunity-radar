import { SOURCES } from '../config/sources.js';
import { fetchSourceEntries } from './fetchSources.js';
import { analyzeEntries } from './llm.js';
import { isSeen, markSeen } from './state.js';

/**
 * Fetches every configured source, diffs against previously-seen entries,
 * and returns the list of genuinely new entries plus any per-source fetch
 * errors (so a single broken feed doesn't kill the whole run).
 */
export async function collectNewEntries(state) {
  const newEntries = [];
  const errors = [];

  for (const source of SOURCES) {
    try {
      const entries = await fetchSourceEntries(source);
      for (const entry of entries) {
        if (!isSeen(state, source.id, entry.id)) {
          newEntries.push(entry);
        }
      }
    } catch (err) {
      errors.push({ source: source.id, message: err.message });
    }
  }

  return { newEntries, errors };
}

export function markAllSeen(state, entries) {
  for (const entry of entries) {
    markSeen(state, entry.source, entry.id);
  }
}

/**
 * Builds the structured digest object that gets saved to disk, emailed,
 * and rendered on the dashboard.
 */
export async function buildDigest({ newEntries, errors, isBootstrap }) {
  const generatedAt = new Date().toISOString();

  if (isBootstrap) {
    return {
      generatedAt,
      isBootstrap: true,
      weekSummary: `Baseline established across ${SOURCES.length} sources (${newEntries.length} existing entries recorded as already-seen). Future digests will only cover what's genuinely new from here.`,
      opportunities: [],
      filtered: [],
      errors,
    };
  }

  if (newEntries.length === 0) {
    return {
      generatedAt,
      isBootstrap: false,
      weekSummary: 'Nothing new published across any tracked source this week.',
      opportunities: [],
      filtered: [],
      errors,
    };
  }

  const { results, weekSummary } = await analyzeEntries(newEntries);
  const byId = new Map(newEntries.map((e) => [e.id, e]));

  const opportunities = [];
  const filtered = [];

  for (const result of results) {
    const entry = byId.get(result.entryId);
    if (!entry) continue; // model hallucinated an id; skip defensively
    const record = {
      source: entry.source,
      title: entry.title,
      url: entry.url,
      date: entry.date,
      reasoning: result.reasoning,
    };
    if (result.significant) {
      opportunities.push({ ...record, ideas: result.ideas ?? [] });
    } else {
      filtered.push(record);
    }
  }

  // Any entries the model didn't return a verdict for still get logged as
  // filtered, with a note, so nothing silently disappears from the digest.
  const judgedIds = new Set(results.map((r) => r.entryId));
  for (const entry of newEntries) {
    if (!judgedIds.has(entry.id)) {
      filtered.push({
        source: entry.source,
        title: entry.title,
        url: entry.url,
        date: entry.date,
        reasoning: '(no verdict returned by the model — included here so it is not silently dropped)',
      });
    }
  }

  return {
    generatedAt,
    isBootstrap: false,
    weekSummary,
    opportunities,
    filtered,
    errors,
  };
}
