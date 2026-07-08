// Minimal source metadata for the dashboard's visual layer only (name,
// category for filter pills, emoji + color for the placeholder "photo").
// Keep in sync with src/config/sources.js if a source id changes.
const SOURCE_META = {
  'openai-news': { name: 'OpenAI', category: 'AI', emoji: '\u{1F916}', color: '#e9e6ff' },
  'anthropic-release-notes': { name: 'Anthropic', category: 'AI', emoji: '✦', color: '#efe6ff' },
  'stripe-changelog': { name: 'Stripe', category: 'Payments', emoji: '\u{1F4B3}', color: '#e3e8ff' },
  'github-changelog': { name: 'GitHub', category: 'DevTools', emoji: '\u{1F419}', color: '#e9e9ec' },
  'twilio-changelog': { name: 'Twilio', category: 'Communications', emoji: '\u{1F4E1}', color: '#e3f0ff' },
  'aws-whats-new': { name: 'AWS', category: 'Cloud', emoji: '☁️', color: '#fff1e0' },
  'cloudflare-blog': { name: 'Cloudflare', category: 'Infra', emoji: '\u{1F310}', color: '#ffe9e9' },
  'vercel-news': { name: 'Vercel', category: 'Hosting', emoji: '▲', color: '#ececec' },
  'supabase-changelog': { name: 'Supabase', category: 'Backend', emoji: '⚡', color: '#e3fff0' },
};
const DEFAULT_META = { name: 'Unknown', category: 'Other', emoji: '\u{1F4E6}', color: '#eee' };

function meta(sourceId) {
  return SOURCE_META[sourceId] || DEFAULT_META;
}

function escapeHtml(str = '') {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function timeAgo(iso) {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk}w ago`;
  const mo = Math.floor(day / 30);
  return `${mo}mo ago`;
}

function fmtDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

// Global registry of clickable items so overlay content can be looked up by id.
const registry = new Map();
let nextId = 0;
function register(kind, payload) {
  const id = `item-${nextId++}`;
  registry.set(id, { kind, payload });
  return id;
}

function renderHero(story) {
  const m = meta(story.source);
  const id = register('opportunity', story);
  return `
    <article class="hero-card" data-id="${id}">
      <div class="hero-banner" style="background:${m.color};">${m.emoji}</div>
      <div class="hero-body">
        <div class="source-row"><span class="source-emoji">${m.emoji}</span>${escapeHtml(m.name)}</div>
        <h2>${escapeHtml(story.title)}</h2>
        <div class="meta-row">${timeAgo(story.date || story.digestDate)} &middot; ${escapeHtml(story.reasoning.slice(0, 80))}${story.reasoning.length > 80 ? '…' : ''}</div>
      </div>
    </article>`;
}

function renderStoryCard(story) {
  const m = meta(story.source);
  const id = register('opportunity', story);
  return `
    <article class="story-card" data-id="${id}">
      <div class="story-thumb" style="background:${m.color};">${m.emoji}</div>
      <div class="story-text">
        <h3>${escapeHtml(story.title)}</h3>
        <div class="meta-row">${escapeHtml(m.name)} &middot; ${timeAgo(story.date || story.digestDate)}</div>
      </div>
    </article>`;
}

function renderFilteredItem(item) {
  const m = meta(item.source);
  const id = register('filtered', item);
  return `
    <div class="filtered-item" data-id="${id}" style="cursor:pointer;">
      <strong>${escapeHtml(m.name)}</strong> &middot; ${escapeHtml(item.title)}
    </div>`;
}

function openSheet(id) {
  const entry = registry.get(id);
  if (!entry) return;
  const { kind, payload } = entry;
  const m = meta(payload.source);
  const content = document.getElementById('sheetContent');

  if (kind === 'opportunity') {
    content.innerHTML = `
      <div class="sheet-banner" style="background:${m.color};">${m.emoji}</div>
      <div class="source-row"><span class="source-emoji">${m.emoji}</span>${escapeHtml(m.name)}</div>
      <h2>${escapeHtml(payload.title)}</h2>
      <div class="meta-row">${timeAgo(payload.date || payload.digestDate)}</div>
      <div class="eli10-box">
        <div class="eli10-label">In simple terms</div>
        <p>${escapeHtml(payload.simpleExplanation || payload.reasoning)}</p>
      </div>
      ${
        (payload.ideas || []).length > 0
          ? `<div class="ideas-label">Ideas you could build</div>` +
            payload.ideas
              .map(
                (idea) => `
              <div class="idea-card">
                <div class="idea-title">${escapeHtml(idea.title)}</div>
                <p>${escapeHtml(idea.description)}</p>
                ${idea.whyNow ? `<p class="why-now">Why now: ${escapeHtml(idea.whyNow)}</p>` : ''}
              </div>`
              )
              .join('')
          : ''
      }
      <details class="deep-dive">
        <summary>Why this isn't just noise (the technical version)</summary>
        <p>${escapeHtml(payload.reasoning)}</p>
      </details>
      ${payload.url ? `<a class="source-link" href="${escapeHtml(payload.url)}" target="_blank" rel="noopener">Read the original changelog entry →</a>` : ''}
    `;
  } else {
    content.innerHTML = `
      <div class="sheet-banner" style="background:#f0f0f0;">${m.emoji}</div>
      <div class="source-row"><span class="source-emoji">${m.emoji}</span>${escapeHtml(m.name)}</div>
      <h2>${escapeHtml(payload.title)}</h2>
      <div class="meta-row">Filtered as routine</div>
      <p class="routine-reason">${escapeHtml(payload.reasoning)}</p>
      ${payload.url ? `<a class="source-link" href="${escapeHtml(payload.url)}" target="_blank" rel="noopener">Read the original changelog entry →</a>` : ''}
    `;
  }

  document.getElementById('overlay').hidden = false;
}

function closeSheet() {
  document.getElementById('overlay').hidden = true;
}

function buildPills(categoriesPresent) {
  const pillsEl = document.getElementById('pills');
  const cats = ['All', ...categoriesPresent];
  pillsEl.innerHTML = cats
    .map((c, i) => `<button class="pill${i === 0 ? ' active' : ''}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`)
    .join('');

  pillsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.pill');
    if (!btn) return;
    pillsEl.querySelectorAll('.pill').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    const cat = btn.dataset.cat;
    document.querySelectorAll('[data-category]').forEach((card) => {
      card.style.display = cat === 'All' || card.dataset.category === cat ? '' : 'none';
    });
  });
}

async function main() {
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error');
  const feedEl = document.getElementById('feed');

  document.getElementById('closeSheet').addEventListener('click', closeSheet);
  document.getElementById('overlay').addEventListener('click', (e) => {
    if (e.target.id === 'overlay') closeSheet();
  });
  feedEl.addEventListener('click', (e) => {
    const card = e.target.closest('[data-id]');
    if (card) openSheet(card.dataset.id);
  });

  try {
    const manifestRes = await fetch('../data/manifest.json', { cache: 'no-store' });
    if (!manifestRes.ok) throw new Error(`manifest.json: HTTP ${manifestRes.status}`);
    const manifest = await manifestRes.json();

    loadingEl.style.display = 'none';

    if (!manifest.digests || manifest.digests.length === 0) {
      feedEl.innerHTML = '<p class="empty-state">No digests yet. The first weekly run will appear here.</p>';
      return;
    }

    const digests = await Promise.all(
      manifest.digests.map(async (entry) => {
        const res = await fetch(`../data/${entry.file}`, { cache: 'no-store' });
        return res.json();
      })
    );

    // Flatten opportunities across all digests, newest digest first.
    const stories = [];
    const filteredByWeek = [];
    const systemCards = [];

    for (const digest of digests) {
      if (digest.isBootstrap) {
        systemCards.push(digest);
        continue;
      }
      for (const opp of digest.opportunities) {
        stories.push({ ...opp, digestDate: digest.generatedAt });
      }
      if (digest.filtered.length > 0) {
        filteredByWeek.push({ generatedAt: digest.generatedAt, items: digest.filtered });
      }
    }

    const categoriesPresent = [...new Set(stories.map((s) => meta(s.source).category))].sort();
    buildPills(categoriesPresent);

    let html = '';

    if (stories.length === 0) {
      const latestReal = digests.find((d) => !d.isBootstrap);
      html += `<div class="quiet-card">${escapeHtml(latestReal ? latestReal.weekSummary : 'Nothing to show yet.')}</div>`;
    } else {
      html += '<h2 class="section-heading">Top Stories</h2>';
      html += renderHero(stories[0]);
      html += '<div class="card-list">' + stories.slice(1).map(renderStoryCard).join('') + '</div>';
    }

    if (filteredByWeek.length > 0) {
      html += '<div class="routine-section">';
      html += '<div class="week-label">Filtered as routine (sanity-check the filter)</div>';
      for (const week of filteredByWeek) {
        html += `
          <details class="filtered-log">
            <summary>Week of ${fmtDate(week.generatedAt)} — ${week.items.length} filtered</summary>
            ${week.items.map(renderFilteredItem).join('')}
          </details>`;
      }
      html += '</div>';
    }

    for (const sys of systemCards) {
      html += `
        <div class="system-card">
          <span class="system-date">${fmtDate(sys.generatedAt)} · baseline run</span>
          ${escapeHtml(sys.weekSummary)}
        </div>`;
    }

    feedEl.innerHTML = html;

    // Tag category on rendered cards after the fact (registry lookup by data-id).
    feedEl.querySelectorAll('[data-id]').forEach((el) => {
      const entry = registry.get(el.dataset.id);
      if (entry && entry.kind === 'opportunity') {
        el.dataset.category = meta(entry.payload.source).category;
      }
    });
  } catch (err) {
    loadingEl.style.display = 'none';
    errorEl.style.display = 'block';
    errorEl.textContent = `Could not load digests: ${err.message}`;
  }
}

main();
