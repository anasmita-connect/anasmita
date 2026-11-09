import { APPS, MONTH } from './data.js';
import { esc, appHref } from './format.js';
import { STUDY } from './study.js';

const byUrl = new Map();
for (const app of APPS) {
  for (const source of app.sources) {
    if (!byUrl.has(source.url)) byUrl.set(source.url, { ...source, apps: [] });
    if (!byUrl.get(source.url).apps.some((entry) => entry.slug === app.slug)) byUrl.get(source.url).apps.push(app);
  }
}
for (const source of STUDY.sources) {
  if (!byUrl.has(source.url)) byUrl.set(source.url, { ...source, apps: [], background: true });
  else byUrl.get(source.url).background = true;
}
byUrl.set('sources/upi-applications-2026-08.pdf', { title: `UPI Applications · ${MONTH}`, publisher: 'Uploaded source PDF', url: 'sources/upi-applications-2026-08.pdf', checked: STUDY.checked, apps: APPS });
const sources = [...byUrl.values()].sort((a, b) => a.publisher.localeCompare(b.publisher) || a.title.localeCompare(b.title));
const list = document.querySelector('#source-directory');
function renderSources(query = '') {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const found = sources.filter((s) => terms.every((term) => `${s.title} ${s.publisher} ${s.apps.map((a) => a.name).join(' ')}`.toLowerCase().includes(term)));
  document.querySelector('#source-count').textContent = `${found.length} sources`;
  list.innerHTML = found.map((s, i) => `<li class="source-card"><span class="source-index">${i + 1}</span><div><a class="source-title" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a><span class="source-publisher">${esc(s.publisher)} · checked ${esc(s.checked)}${s.background ? ' · Background' : ''}</span>${s.apps.length ? `<details class="source-apps"><summary>${s.apps.length === 1 ? esc(s.apps[0].name) : `${s.apps.length} apps`}</summary><p>${s.apps.map((a) => `<a href="${appHref(a)}">${esc(a.name)}</a>`).join(' · ')}</p></details>` : ''}</div></li>`).join('');
}
const cell = (value) => {
  let text = String(value ?? '');
  if (/^[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};
function downloadCSV(name, rows) {
  const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map((row) => row.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = name; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
document.querySelector('#download-sources').addEventListener('click', () => downloadCSV('upi-sources.csv', [
  ['Publisher', 'Title', 'URL', 'Checked', 'Apps', 'Background'],
  ...sources.map((s) => [s.publisher, s.title, new URL(s.url, location.href).href, s.checked, s.apps.map((a) => a.name).join('; '), s.background ? 'Yes' : 'No']),
]));
document.querySelector('#download-audiences').addEventListener('click', () => {
  const url = (app, ids) => ids.map((id) => app.sources.find((s) => s.id === id).url).join('; ');
  const rows = [['App', 'Headline', 'Tags', 'Dimension', 'Estimate', 'Basis', 'Reason', 'Source URLs']];
  for (const app of APPS) {
    const p = app.audienceProfile;
    for (const d of p.dimensions) rows.push([app.name, p.headline, p.tags.join('; '), d.key, d.value, d.basis === 'stated' ? 'Reported' : 'Estimate', d.reason, url(app, d.sources)]);
  }
  downloadCSV('upi-audience-profiles.csv', rows);
});
document.querySelector('#dataset-notes').innerHTML = `<ul>${STUDY.notes.map((note) => `<li>${esc(note)}</li>`).join('')}</ul>`;
document.querySelector('#source-q').addEventListener('input', (event) => renderSources(event.target.value));
renderSources();
