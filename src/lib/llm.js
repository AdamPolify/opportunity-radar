import Anthropic from '@anthropic-ai/sdk';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

let _client = null;
function client() {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set.');
    }
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

function extractJson(text) {
  // Models sometimes wrap JSON in prose or a fenced code block; pull out the
  // first well-formed JSON array/object we can find.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.search(/[[{]/);
  if (start === -1) throw new Error(`No JSON found in model output: ${text.slice(0, 200)}`);
  return JSON.parse(candidate.slice(start).trim().replace(/,\s*([}\]])/g, '$1'));
}

/**
 * Splits a chunk of raw changelog markdown (newest-first, dated sections)
 * into discrete entries. Used for sources whose entries all live on one
 * long page rather than an RSS feed.
 */
export async function extractMarkdownEntries({ sourceName, markdown }) {
  const msg = await client().messages.create({
    model: MODEL,
    max_tokens: 4000,
    system:
      'You split raw changelog markdown into discrete, dated entries. ' +
      'Output ONLY a JSON array, no prose. Each element: ' +
      '{"date": "YYYY-MM-DD or null", "title": "short title", "summary": "1-3 sentence summary of what actually changed"}. ' +
      'One element per distinct dated change or dated section. Skip navigation text, headers, and boilerplate that are not actual changes. ' +
      'If you cannot confidently find any dated entries, return [].',
    messages: [
      {
        role: 'user',
        content: `Source: ${sourceName}\n\nRaw changelog markdown:\n\n${markdown}`,
      },
    ],
  });
  const text = msg.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
  try {
    const parsed = extractJson(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const ANALYSIS_SYSTEM_PROMPT = `You are a skeptical, experienced product advisor for solo developers and indie hackers. You review new changelog entries from major developer platforms (OpenAI, Anthropic, Stripe, GitHub, Twilio, AWS, Cloudflare, Vercel, Supabase, etc.) and judge whether each one represents a genuine, buildable product opportunity for a solo developer — or is routine noise.

Be genuinely skeptical. Most changelog entries are NOT opportunities. Treat as routine noise:
- Bug fixes, security patches, minor version bumps
- Small UI tweaks, wording changes, deprecation notices with no new capability
- Performance improvements with no new capability unlocked
- Regional/language rollouts of an already-existing feature
- Internal tooling or enterprise-only features irrelevant to a solo developer
- Vague marketing announcements with no concrete new capability

Treat as a genuine opportunity only if it plausibly does one of:
- Opens a new public API or capability that didn't exist before
- Meaningfully changes pricing (price drop, new free tier, removed usage cap)
- Removes a restriction that previously blocked building something (rate limits, access gating, data access)
- Unlocks new data access or integration surface
- Creates a new "arbitrage window" — a gap where a small team can build something big platforms haven't yet, before the ecosystem catches up

For every entry classified as an opportunity, generate 2-3 CONCRETE product ideas. Concrete means: specific enough that a solo developer could scope and start building within days. Bad idea: "build a tool that uses this API." Good idea: "a Chrome extension that watches a user's Stripe dashboard and auto-drafts refund-decline emails using the new X capability, sold as a $9/mo SaaS to small e-commerce shops."

Be honest, not hype-driven. If a week has nothing meaningful, say so plainly. Do not manufacture urgency or inflate routine changes into "opportunities" to make the digest feel more exciting than it is. A false positive (calling noise an opportunity) is worse than a false negative, because it erodes trust in the filter — but note in your reasoning if something is borderline so the user can judge for themselves.

For every entry classified as an opportunity, also write a "simpleExplanation": explain what changed as if to a curious 10-year-old. One or two short sentences, no jargon, no acronyms without explaining them, concrete everyday analogy if it helps. This is the first thing the user reads, so it must actually be simple — not just a shorter version of the technical reasoning.

Respond with ONLY a JSON object (no prose, no markdown fences) of this exact shape:
{
  "results": [
    {
      "entryId": "<the id given for this entry>",
      "significant": true | false,
      "reasoning": "1-3 sentences: what changed and why it does or doesn't matter for a solo builder",
      "simpleExplanation": "1-2 plain-English sentences a 10-year-old could follow (only for significant entries; omit or leave empty otherwise)",
      "ideas": [
        { "title": "short punchy name", "description": "2-4 sentences, concrete enough to start scoping", "whyNow": "why this window exists now and won't last forever" }
      ]
    }
  ],
  "weekSummary": "1-2 honest sentences summarizing the week overall — say plainly if nothing meaningful happened"
}
"ideas" must be empty for entries where significant is false.`;

/**
 * Runs the core judgment step: given a batch of new changelog entries,
 * classify each as significant or noise, and generate product ideas for
 * the significant ones.
 */
export async function analyzeEntries(entries) {
  if (entries.length === 0) {
    return { results: [], weekSummary: 'No new changelog entries this week.' };
  }

  const payload = entries.map((e) => ({
    entryId: e.id,
    source: e.source,
    title: e.title,
    date: e.date,
    url: e.url,
    summary: e.summary,
  }));

  const msg = await client().messages.create({
    model: MODEL,
    max_tokens: 32000,
    system: ANALYSIS_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Here are this week's new changelog entries as JSON:\n\n${JSON.stringify(payload, null, 2)}`,
      },
    ],
  });

  const text = msg.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
  const parsed = extractJson(text);
  return {
    results: Array.isArray(parsed.results) ? parsed.results : [],
    weekSummary: parsed.weekSummary ?? '',
  };
}
