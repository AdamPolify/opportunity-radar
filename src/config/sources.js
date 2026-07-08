// Every source below is fetched with a plain HTTP GET — no headless browser,
// no API keys required for fetching. Verified working as of 2026-07-09.
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
