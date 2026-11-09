// Merges research/profile-parts/out-*.json into research/profile-parts/merged-<group>.json, validating shape and tags.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEMOGRAPHIC_FILTERS } from '../public/catalog.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'research/profile-parts');
const input = JSON.parse(fs.readFileSync(path.join(dir, 'input.json'), 'utf8'));
const KEYS = ['age', 'location', 'employment', 'income', 'gender'];
const groups = {};
const problems = [];
for (const f of fs.readdirSync(dir).filter((f) => /^out-\d+\.json$/.test(f)).sort()) {
  for (const [name, p] of Object.entries(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))) {
    if (!input[name]) { problems.push(`${f}: unknown app ${name}`); continue; }
    const ids = new Set((p.sources || []).filter((s) => /^https:\/\//.test(s.url) && s.title && s.publisher && s.supports).map((s) => s.id));
    const bad = p.tags.filter((t) => !DEMOGRAPHIC_FILTERS[t]);
    if (bad.length) problems.push(`${name}: dropped tags ${bad}`);
    p.tags = p.tags.filter((t) => DEMOGRAPHIC_FILTERS[t]);
    p.sources = p.sources.filter((s) => ids.has(s.id)).map((s) => ({ ...s, checked: s.checked || '2026-11-09' }));
    p.caveats ||= [];
    const dims = KEYS.map((k) => p.dimensions.find((d) => d.key === k));
    if (dims.some((d) => !d || !d.sources?.some((id) => ids.has(id)))) { problems.push(`${name}: missing or uncited dimension`); }
    p.dimensions = dims.filter(Boolean).map((d) => ({ ...d, basis: d.basis === 'stated' ? 'stated' : 'inferred', sources: d.sources.filter((id) => ids.has(id)) }));
    (groups[input[name].group] ||= {})[name] = p;
  }
}
// research/profiles-*.json are owned by separate research passes. Write candidates beside the parts instead.
for (const [g, recs] of Object.entries(groups)) fs.writeFileSync(path.join(dir, `merged-${g}.json`), JSON.stringify(recs, null, 1) + '\n');
const done = Object.values(groups).reduce((n, r) => n + Object.keys(r).length, 0);
console.log(`merged ${done}/${Object.keys(input).length}`);
const missing = Object.keys(input).filter((n) => !Object.values(groups).some((r) => r[n]));
if (missing.length) console.log('missing:', missing.join(', '));
if (problems.length) console.log('problems:\n  ' + problems.join('\n  '));
