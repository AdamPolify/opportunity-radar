# Opportunity Radar

A zero-maintenance weekly digest that watches changelogs from major developer
platforms and tries to tell you, honestly, when something is actually worth
building on — as opposed to routine noise.

Every week it:

1. Fetches new entries from each source in [`src/config/sources.js`](src/config/sources.js).
2. Diffs them against everything it's seen before (`data/state.json`).
3. Sends the new entries to Claude with a deliberately skeptical prompt: classify
   each as **genuine opportunity** or **routine noise**, and for opportunities,
   generate 2-3 concrete, buildable product ideas.
4. Writes a digest (`data/digests/<date>.json`), emails it to you, and updates
   the static dashboard.

If nothing meaningful happened, the digest says so. It does not manufacture
urgency to make the week feel more exciting than it was.

## How sources are fetched

No headless browser, no scraping-fragile HTML parsing. Every source is either:

- **RSS/Atom** (GitHub, AWS, Twilio, Cloudflare, Vercel, Supabase, OpenAI News) — parsed directly.
- **Markdown-twin docs pages** (Anthropic, Stripe) — these platforms serve clean
  Markdown when you append `.md` to a docs URL (a Mintlify-style convention).
  Claude splits the page into discrete dated entries.

This is more robust than scraping rendered HTML, but it does mean the source
list is limited to platforms with one of these two things available. See
"Limitations" below.

## One-time setup

### 1. Push this to a GitHub repo

```bash
cd opportunity-radar
git init
git add .
git commit -m "Initial commit"
gh repo create opportunity-radar --private --source=. --push
```

### 2. Add repository secrets

Settings → Secrets and variables → Actions → New repository secret:

| Secret | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key (console.anthropic.com) |
| `MAIL_SERVER` | e.g. `smtp.gmail.com` |
| `MAIL_PORT` | e.g. `465` |
| `MAIL_USERNAME` | Your SMTP username (e.g. your Gmail address) |
| `MAIL_PASSWORD` | An app password (not your regular password — Gmail: myaccount.google.com/apppasswords) |
| `EMAIL_TO` | Where the digest should be sent, e.g. `adam@polify.xyz` |

### 3. Enable GitHub Pages for the dashboard

Settings → Pages → Source: **Deploy from a branch** → Branch: `main`, folder: `/ (root)`.

The dashboard will be live at `https://<you>.github.io/<repo>/dashboard/`. It
reads `data/manifest.json` and `data/digests/*.json` directly — no backend, no
build step.

### 4. First run

The workflow runs automatically every Monday at 13:00 UTC. To trigger it
immediately: Actions tab → "Weekly Opportunity Radar Digest" → Run workflow.

**The first run is a baseline pass.** Every source has months or years of
history in it — the first run records all of it as "already seen" rather than
emailing you a digest of 3,000 historical changelog entries. You'll get a
short "baseline established" email instead. Every run after that only
contains genuinely new entries.

## Local usage

```bash
npm install
cp .env.example .env   # fill in ANTHROPIC_API_KEY
npm run run            # full run: fetches, analyzes, writes digest + state
npm run run:dry         # fetches + analyzes but does not touch state.json/manifest.json
```

Output lands in `data/digests/`, `data/latest-email.html`, and
`data/latest-subject.txt` either way — dry runs just don't mark anything as
seen or update the dashboard manifest, so you can re-run repeatedly while
testing.

## Customizing sources

Edit [`src/config/sources.js`](src/config/sources.js). Each entry needs:

```js
{ id, name, category, type: 'rss' | 'markdown', url }
```

For a new platform, first check if it has an RSS/Atom feed (`/rss.xml`,
`/feed`, `/changelog/feed`, `/atom` are common). If not, try appending `.md`
to its docs changelog URL — many modern docs platforms (Mintlify, etc.)
support this. If neither works, it isn't currently supported without adding a
new fetch strategy (e.g. a headless-browser fetcher), which this project
intentionally avoids to stay zero-maintenance.

## Cost

Each run makes 1-3 Claude API calls (one classification/ideation call, plus
one extraction call per markdown-type source with new content). At Claude
Sonnet pricing this is a few cents per week, even in weeks with a lot of
activity.

## Limitations — read this before trusting it blindly

- **OpenAI's main API changelog** (`platform.openai.com/docs/changelog`) is a
  JavaScript-rendered page with no RSS feed or markdown twin, so it isn't
  tracked directly. This tracks **OpenAI's news RSS feed** instead, which
  covers the same major announcements but may miss small API-only changelog
  entries that never get a news post.
- The filter is a judgment call made by an LLM. It's told to be skeptical and
  to err toward calling things noise, but it will occasionally miscall
  something in either direction. That's exactly why every digest includes the
  filtered-out list — check it periodically.
- If a source's RSS/markdown endpoint changes shape or disappears, that
  source's fetch will fail loudly (logged in `errors` in the digest and in
  the Action logs) rather than silently going empty.
