function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function fmtDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

export function renderEmailSubject(digest) {
  const dateStr = fmtDate(digest.generatedAt);
  if (digest.isBootstrap) return `Opportunity Radar — baseline set up (${dateStr})`;
  if (digest.opportunities.length === 0) return `Opportunity Radar — quiet week, nothing new (${dateStr})`;
  return `Opportunity Radar — ${digest.opportunities.length} opportunit${digest.opportunities.length === 1 ? 'y' : 'ies'} this week (${dateStr})`;
}

export function renderEmailText(digest) {
  const lines = [];
  lines.push(`Opportunity Radar — ${fmtDate(digest.generatedAt)}`);
  lines.push('');
  lines.push(digest.weekSummary);
  lines.push('');

  if (digest.opportunities.length > 0) {
    lines.push('=== OPPORTUNITIES ===');
    for (const opp of digest.opportunities) {
      lines.push('');
      lines.push(`[${opp.source}] ${opp.title}`);
      if (opp.url) lines.push(opp.url);
      if (opp.simpleExplanation) lines.push(`In plain terms: ${opp.simpleExplanation}`);
      lines.push(`Why it matters: ${opp.reasoning}`);
      for (const idea of opp.ideas ?? []) {
        lines.push(`  - Idea: ${idea.title}`);
        lines.push(`    ${idea.description}`);
        if (idea.whyNow) lines.push(`    Why now: ${idea.whyNow}`);
      }
    }
    lines.push('');
  }

  if (digest.filtered.length > 0) {
    lines.push(`=== FILTERED AS ROUTINE (${digest.filtered.length}) ===`);
    for (const f of digest.filtered) {
      lines.push(`- [${f.source}] ${f.title} — ${f.reasoning}`);
    }
    lines.push('');
  }

  if (digest.errors?.length > 0) {
    lines.push('=== SOURCE FETCH ERRORS ===');
    for (const e of digest.errors) {
      lines.push(`- ${e.source}: ${e.message}`);
    }
  }

  return lines.join('\n');
}

export function renderEmailHtml(digest) {
  const opportunitiesHtml = digest.opportunities
    .map(
      (opp) => `
      <div style="margin-bottom:24px;padding:16px;border:1px solid #e2e2e2;border-radius:8px;">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#666;">${escapeHtml(opp.source)}</div>
        <h3 style="margin:4px 0 8px;">${opp.url ? `<a href="${escapeHtml(opp.url)}" style="color:#111;text-decoration:none;">${escapeHtml(opp.title)}</a>` : escapeHtml(opp.title)}</h3>
        ${opp.simpleExplanation ? `<p style="background:#eef4ee;border-radius:6px;padding:8px 12px;color:#2a4d33;margin:0 0 10px;font-size:14px;">${escapeHtml(opp.simpleExplanation)}</p>` : ''}
        <p style="color:#333;margin:0 0 12px;">${escapeHtml(opp.reasoning)}</p>
        ${(opp.ideas ?? [])
          .map(
            (idea) => `
          <div style="background:#f7f7f5;border-radius:6px;padding:10px 14px;margin-bottom:8px;">
            <strong>${escapeHtml(idea.title)}</strong>
            <p style="margin:4px 0;">${escapeHtml(idea.description)}</p>
            ${idea.whyNow ? `<p style="margin:0;color:#666;font-size:13px;"><em>Why now:</em> ${escapeHtml(idea.whyNow)}</p>` : ''}
          </div>`
          )
          .join('')}
      </div>`
    )
    .join('');

  const filteredHtml =
    digest.filtered.length > 0
      ? `
      <h3>Filtered as routine (${digest.filtered.length})</h3>
      <ul style="color:#666;font-size:14px;">
        ${digest.filtered.map((f) => `<li><strong>[${escapeHtml(f.source)}]</strong> ${escapeHtml(f.title)} — ${escapeHtml(f.reasoning)}</li>`).join('')}
      </ul>`
      : '';

  const errorsHtml =
    digest.errors?.length > 0
      ? `
      <h3>Source fetch errors</h3>
      <ul style="color:#a33;font-size:14px;">
        ${digest.errors.map((e) => `<li>${escapeHtml(e.source)}: ${escapeHtml(e.message)}</li>`).join('')}
      </ul>`
      : '';

  return `<!doctype html>
<html>
  <body style="font-family:-apple-system,Helvetica,Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#111;">
    <h1 style="font-size:20px;">Opportunity Radar</h1>
    <p style="color:#444;">${escapeHtml(digest.weekSummary)}</p>
    ${opportunitiesHtml || '<p style="color:#888;">No opportunities identified this week.</p>'}
    ${filteredHtml}
    ${errorsHtml}
    <p style="color:#999;font-size:12px;margin-top:32px;">Generated ${escapeHtml(fmtDate(digest.generatedAt))}. Full history in the dashboard.</p>
  </body>
</html>`;
}
