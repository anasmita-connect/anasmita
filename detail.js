import { MONTH, TYPES, DEMOGRAPHIC_DIMENSIONS, PROFILE_DIMENSIONS, DEMOGRAPHIC_FILTERS } from './data.js';
import { apps, esc, nf, fmtVol, fmtVal, fmtTicket, sharePct, share, subLine } from './format.js';

const profile = document.querySelector('#profile');
const date = (value) => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
const sourceRef = (n) => `<a class="source-ref" href="#source-${n}" aria-label="Source ${n}">[${n}]</a>`;

export function renderProfile(id) {
  const app = apps.find((a) => a.slug === id);
  if (!app) {
    document.title = 'App not found';
    profile.innerHTML = '<div class="detail-heading"><h1>App not found</h1><p>Choose an app from the <a href="./">list</a>.</p></div>';
    return;
  }

  document.title = `${app.name} — audience & sources`;
  document.documentElement.style.setProperty('--c', TYPES[app.type].color);
  const copy = app.display;
  const refs = (ids) => ids.map((sourceId) => sourceRef(app.sources.findIndex((s) => s.id === sourceId) + 1)).join(' ');
  const tableNumber = app.sources.length + 1;
  const checked = app.sources.map((s) => s.checked).sort().at(-1);
  const tableSource = `sources/upi-applications-2026-08.pdf#page=${app.row > 91 ? 2 : 1}`;
  const notes = copy.notes.filter((note) => note !== 'Joining requirements not confirmed.');
  const audience = app.intendedAudience;
  const profileData = app.audienceProfile;
  const audienceItem = (item, main = false) => `<div class="audience-item${main ? ' audience-main' : ''}"><div class="audience-label"><h3>${esc(item.label)}</h3> ${refs(item.sources)}<span class="audience-basis">${item.basis === 'explicit' ? 'Stated audience' : 'Audience assessment'}</span></div><p>${esc(item.text)}</p></div>`;
  const eligibility = app.eligibility;
  const eligibilityRows = eligibility.map((item) => `<div class="claim"><dt>${esc(DEMOGRAPHIC_DIMENSIONS[item.dimension])}</dt><dd><strong>${esc(item.value)}</strong>. ${esc(item.text)} ${refs(item.sources)}</dd></div>`).join('');

  profile.innerHTML = `
    <header class="detail-heading">
      <p class="app-category">${esc(subLine(app))}</p>
      <h1>${esc(app.name)}</h1>
      <p class="detail-summary">${esc(copy.summary)} ${refs(copy.summarySources)}</p>
      <a class="sources-jump" href="#sources">Sources ↓</a>
    </header>

    <section class="audience-panel" aria-labelledby="audience-title">
      <h2 id="audience-title">Who uses it</h2>
      <p class="profile-headline">${esc(profileData.headline)}</p>
      <ul class="profile-tags">${profileData.tags.map((t) => `<li>${esc(DEMOGRAPHIC_FILTERS[t] || t)}</li>`).join('')}</ul>
      <dl class="profile-grid">${profileData.dimensions.map((item) => `<div class="profile-dim"><dt>${esc(PROFILE_DIMENSIONS[item.key])}<span class="audience-basis">${item.basis === 'stated' ? 'Reported' : 'Estimate'}</span></dt><dd><strong>${esc(item.value)}</strong> ${refs(item.sources)}<p>${esc(item.reason)}</p></dd></div>`).join('')}</dl>
      ${profileData.caveats.length ? `<p class="supporting-note">${profileData.caveats.map(esc).join(' ')}</p>` : ''}
      ${audience.secondary.length ? `<details class="audience-secondary"><summary>Specific products & other audiences</summary>${audience.secondary.map((item) => audienceItem(item)).join('')}</details>` : ''}
    </section>

    <div class="detail-layout">
      <section class="requirements" aria-labelledby="requirements-title">
        <h2 id="requirements-title">Requirements</h2>
        ${copy.requirements.length ? `<dl class="requirement-list">${copy.requirements.map((item) => `<div class="claim"><dt>${esc(item.label)}</dt><dd>${esc(item.text)} ${refs(item.sources)}</dd></div>`).join('')}</dl>` : eligibility.length ? `<dl class="requirement-list">${eligibilityRows}</dl>` : '<p class="supporting-note">Joining requirements not confirmed.</p>'}
        ${eligibility.length && copy.requirements.length ? `<details class="eligibility-details"><summary>Eligibility details</summary><dl class="requirement-list">${eligibilityRows}</dl></details>` : ''}
        ${notes.length ? `<div class="app-notes"><h3>Notes</h3><ul>${notes.map((note) => `<li>${esc(note)}</li>`).join('')}</ul></div>` : ''}
      </section>

      <section class="stats-panel" aria-labelledby="stats-title">
        <h2 id="stats-title">UPI <span class="stats-month">${MONTH}</span> ${sourceRef(tableNumber)}</h2>
        <dl class="headline-stats"><div><dt>Transactions</dt><dd>${fmtVol(app.vol)}</dd></div><div><dt>Value</dt><dd>${fmtVal(app.val)}</dd></div><div><dt>Average payment</dt><dd>${fmtTicket(app.ticket)}</dd></div><div><dt>Share of table total</dt><dd>${sharePct(share(app))}</dd></div></dl>
        ${app.sub ? '<p class="supporting-note">Figures cover the bank’s apps combined.</p>' : ''}
        <details class="transaction-details">
          <summary>Transaction details</summary>
          <div class="stats-scroll"><table class="source-numbers"><caption>Volume in millions · value in ₹ crore</caption><thead><tr><th scope="col">Type</th><th scope="col">Volume</th><th scope="col">Value</th></tr></thead><tbody>${[['cit', 'Customer-initiated'], ['b2c', 'B2C'], ['b2b', 'B2B'], ['onus', 'On-us'], ['total', 'Total']].map(([key, label]) => `<tr><th scope="row">${label}</th><td>${nf(app[key][0], 2)}</td><td>${nf(app[key][1], 2)}</td></tr>`).join('')}</tbody></table></div>
          <p class="supporting-note">Original label: ${esc(app.originalName)}. Rounded columns may not add up to the printed total. Shares include “Others”; averages use total value ÷ volume.</p>
        </details>
        <a class="document-link" href="${tableSource}" target="_blank" rel="noopener noreferrer">Source PDF ↗</a>
      </section>
    </div>

    <section class="sources-panel" id="sources" aria-labelledby="sources-title">
      <div class="sources-heading"><h2 id="sources-title">Sources</h2><span>Checked ${date(checked)}</span></div>
      <ol class="source-list">${app.sources.map((source, i) => `<li id="source-${i + 1}" class="source-card"><span class="source-index">${i + 1}</span><div><a class="source-title" href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a><span class="source-publisher">${esc(source.publisher)}</span></div></li>`).join('')}
      <li id="source-${tableNumber}" class="source-card"><span class="source-index">${tableNumber}</span><div><a class="source-title" href="${tableSource}" target="_blank" rel="noopener noreferrer">UPI Applications · ${MONTH} ↗</a><span class="source-publisher">Uploaded PDF, row ${app.row}. Not independently matched to <a href="https://www.npci.org.in/what-we-do/upi/upi-ecosystem-statistics" target="_blank" rel="noopener noreferrer">NPCI’s website</a>.</span></div></li></ol>
    </section>`;
}

renderProfile(new URLSearchParams(location.search).get('id'));
