// Every source below is fetched with a plain HTTP GET — no headless browser,
// no API keys required for fetching. Verified working as of 2026-07-09.
//
// Sources considered but skipped because they require a JS-rendered
// headless browser (against this project's zero-maintenance goal): the
// OpenAI API changelog page itself (openai-news is used instead), Google
// Gemini's changelog page (google-ai-blog is used instead), Meta AI / Llama,
// Mistral's dedicated changelog page (mistral-news blog RSS used instead),
// and xAI/Grok (no public RSS or markdown-twin changelog found).
//
// type: 'rss'      -> standard RSS/Atom feed, parsed with rss-parser
// type: 'markdown' -> a docs page that serves clean Markdown when ".md" is
//                      appended to the URL (Mintlify-style docs convention).
//                      Entries are chronological sections within one page,
//                      so an LLM call splits them into discrete items.

export const SOURCES = [
  {
    id: 'openai-news',
    name: 'OpenAI News',
    category: 'AI',
    type: 'rss',
    url: 'https://openai.com/news/rss.xml',
  },
  {
    id: 'anthropic-release-notes',
    name: 'Anthropic (Claude Platform release notes)',
    category: 'AI',
    type: 'markdown',
    url: 'https://platform.claude.com/docs/en/release-notes/overview.md',
  },
  {
    id: 'stripe-changelog',
    name: 'Stripe Changelog',
    category: 'Payments',
    type: 'markdown',
    url: 'https://docs.stripe.com/changelog.md',
  },
  {
    id: 'google-ai-blog',
    name: 'Google AI Blog',
    category: 'AI',
    type: 'rss',
    url: 'https://blog.google/technology/ai/rss/',
  },
  {
    id: 'mistral-news',
    name: 'Mistral AI',
    category: 'AI',
    type: 'rss',
    url: 'https://mistral.ai/rss.xml',
  },
  {
    id: 'apple-developer-releases',
    name: 'Apple Developer Releases',
    category: 'Platforms',
    type: 'rss',
    url: 'https://developer.apple.com/news/releases/rss/releases.rss',
  },
  {
    id: 'github-changelog',
    name: 'GitHub Changelog',
    category: 'DevTools',
    type: 'rss',
    url: 'https://github.blog/changelog/feed/',
  },
  {
    id: 'twilio-changelog',
    name: 'Twilio Changelog',
    category: 'Communications',
    type: 'rss',
    url: 'https://www.twilio.com/en-us/changelog.feed.xml',
  },
  {
    id: 'aws-whats-new',
    name: "AWS What's New",
    category: 'Cloud',
    type: 'rss',
    url: 'https://aws.amazon.com/about-aws/whats-new/recent/feed/',
  },
  {
    id: 'cloudflare-blog',
    name: 'Cloudflare Blog',
    category: 'Infra',
    type: 'rss',
    url: 'https://blog.cloudflare.com/rss/',
  },
  {
    id: 'vercel-news',
    name: 'Vercel News',
    category: 'Hosting',
    type: 'rss',
    url: 'https://vercel.com/atom',
  },
  {
    id: 'supabase-changelog',
    name: 'Supabase Changelog',
    category: 'Backend',
    type: 'rss',
    url: 'https://supabase.com/rss.xml',
  },
];
