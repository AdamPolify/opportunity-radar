function escapeHtml(str = '') {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmtDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

function renderIdea(idea) {
  return `
    <div class="idea">
      <div class="idea-title">${escapeHtml(idea.title)}</div>
      <p>${escapeHtml(idea.description)}</p>
      ${idea.whyNow ? `<p class="why-now">Why now: ${escapeHtml(idea.whyNow)}</p>` : ''}
    </div>`;
}

function renderOpportunity(opp) {
  const titleHtml = opp.url
    ? `<a href="${escapeHtml(opp.url)}" target="_blank" rel="noopener">${escapeHtml(opp.title)}</a>`
    : escapeHtml(opp.title);
  return `
    <div class="opportunity">
      <div class="source-tag">${escapeHtml(opp.source)}</div>
      <h3>${titleHtml}</h3>
      <p class="reasoning">${escapeHtml(opp.reasoning)}</p>
      ${(opp.ideas || []).map(renderIdea).join('')}
    </div>`;
}

function renderFilteredLog(filtered) {
  if (!filtered || filtered.length === 0) return '';
  return `
    <details class="filtered-log">
      <summary>Filtered as routine (${filtered.length}) — sanity-check the filter</summary>
      <ul>
        ${filtered.map((f) => `<li><strong>[${escapeHtml(f.source)}]</strong> ${escapeHtml(f.title)} — ${escapeHtml(f.reasoning)}</li>`).join('')}
      </ul>
    </details>`;
}

function renderErrors(errors) {
  if (!errors || errors.length === 0) return '';
  return `
    <div class="errors">
      Source fetch errors: ${errors.map((e) => `${escapeHtml(e.source)} (${escapeHtml(e.message)})`).join(', ')}
    </div>`;
}

function renderDigest(entry, digest) {
  if (digest.isBootstrap) {
    return `
      <section class="digest">
        <div class="digest-header">
          <span class="digest-date">${fmtDate(digest.generatedAt)}</span>
          <span class="digest-meta">baseline run</span>
        </div>
        <div class="bootstrap-note">${escapeHtml(digest.weekSummary)}</div>
      </section>`;
  }

  return `
    <section class="digest">
      <div class="digest-header">
        <span class="digest-date">${fmtDate(digest.generatedAt)}</span>
        <span class="digest-meta">${digest.opportunities.length} opportunit${digest.opportunities.length === 1 ? 'y' : 'ies'} · ${digest.filtered.length} filtered</span>
      </div>
      <p class="week-summary">${escapeHtml(digest.weekSummary)}</p>
      ${
        digest.opportunities.length > 0
          ? digest.opportunities.map(renderOpportunity).join('')
          : '<p class="empty-state">No opportunities identified this week.</p>'
      }
      ${renderFilteredLog(digest.filtered)}
      ${renderErrors(digest.errors)}
    </section>`;
}

async function main() {
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error');
  const digestsEl = document.getElementById('digests');

  try {
    const manifestRes = await fetch('../data/manifest.json', { cache: 'no-store' });
    if (!manifestRes.ok) throw new Error(`manifest.json: HTTP ${manifestRes.status}`);
    const manifest = await manifestRes.json();

    if (!manifest.digests || manifest.digests.length === 0) {
      loadingEl.style.display = 'none';
      digestsEl.innerHTML = '<p class="empty-state">No digests yet. The first weekly run will appear here.</p>';
      return;
    }

    const digests = await Promise.all(
      manifest.digests.map(async (entry) => {
        const res = await fetch(`../data/${entry.file}`, { cache: 'no-store' });
        return { entry, digest: await res.json() };
      })
    );

    loadingEl.style.display = 'none';
    digestsEl.innerHTML = digests.map(({ entry, digest }) => renderDigest(entry, digest)).join('');
  } catch (err) {
    loadingEl.style.display = 'none';
    errorEl.style.display = 'block';
    errorEl.textContent = `Could not load digests: ${err.message}`;
  }
}

main();
