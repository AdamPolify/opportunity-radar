import Parser from 'rss-parser';
import { stableId } from './hash.js';
import { extractMarkdownEntries } from './llm.js';

const rssParser = new Parser({
  timeout: 15_000,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OpportunityRadar/1.0)' },
});

const FETCH_HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; OpportunityRadar/1.0)' };

// How much of a markdown changelog page to hand to the LLM for extraction.
// These pages are newest-first, so the head of the document is what matters.
const MARKDOWN_EXTRACT_CHARS = 12_000;

/**
 * Fetches raw entries from a single configured source.
 * Returns a normalized list: { id, title, url, date, summary, source }
 */
export async function fetchSourceEntries(source) {
  if (source.type === 'rss') {
    return fetchRssEntries(source);
  }
  if (source.type === 'markdown') {
    return fetchMarkdownEntries(source);
  }
  throw new Error(`Unknown source type "${source.type}" for ${source.id}`);
}

async function fetchRssEntries(source) {
  const feed = await rssParser.parseURL(source.url);
  return (feed.items ?? []).map((item) => {
    const link = item.link ?? item.guid ?? '';
    const title = item.title ?? '(untitled)';
    const date = item.isoDate ?? item.pubDate ?? null;
    const summary = (item.contentSnippet ?? item.content ?? '').trim().slice(0, 2000);
    return {
      id: stableId(source.id, link || title),
      title,
      url: link,
      date,
      summary,
      source: source.id,
    };
  });
}

async function fetchMarkdownEntries(source) {
  const res = await fetch(source.url, { headers: FETCH_HEADERS });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${source.url}: HTTP ${res.status}`);
  }
  const fullText = await res.text();
  const excerpt = fullText.slice(0, MARKDOWN_EXTRACT_CHARS);

  const extracted = await extractMarkdownEntries({
    sourceName: source.name,
    markdown: excerpt,
  });

  return extracted.map((entry) => ({
    // Hashed by date only, not title: the LLM rephrases titles slightly
    // between runs, which would otherwise cause the same already-seen
    // entry to look "new" again every time wording drifts.
    id: stableId(source.id, entry.date),
    title: entry.title,
    url: source.url.replace(/\.md$/, ''),
    date: entry.date ?? null,
    summary: entry.summary ?? '',
    source: source.id,
  }));
}
