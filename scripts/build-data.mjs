import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, 'research', name), 'utf8'));
const register = read('register.json');
const evidence = {};
const copy = {};
const demographics = {};
const audiences = {};
const profiles = {};
for (const file of ['profiles-payments-wealth.json', 'profiles-cards-lending.json', 'profiles-banks.json']) {
  for (const [name, record] of Object.entries(read(file))) {
    if (profiles[name]) throw new Error(`Duplicate audience profile: ${name}`);
    profiles[name] = record;
  }
}
// Specific guesstimates from research/profile-parts/out-*.json take precedence over the base profile files.
const partsDir = path.join(root, 'research', 'profile-parts');
for (const file of fs.readdirSync(partsDir).filter((f) => /^out-\d+\.json$/.test(f)).sort()) {
  Object.assign(profiles, JSON.parse(fs.readFileSync(path.join(partsDir, file), 'utf8')));
}
for (const file of ['audiences-payments-wealth.json', 'audiences-cards-lending.json', 'audiences-banks.json']) {
  for (const [name, record] of Object.entries(read(file))) {
    if (audiences[name]) throw new Error(`Duplicate intended audience: ${name}`);
    audiences[name] = record;
  }
}
for (const file of ['demographics-payments-wealth.json', 'demographics-cards-lending.json', 'demographics-banks.json']) {
  for (const [name, record] of Object.entries(read(file))) {
    if (demographics[name]) throw new Error(`Duplicate demographic record: ${name}`);
    demographics[name] = record;
  }
}
for (const file of ['copy-core.json', 'copy-cards.json', 'copy-wealth.json', 'copy-lending.json']) {
  for (const [name, record] of Object.entries(read(file))) {
    if (copy[name]) throw new Error(`Duplicate copy: ${name}`);
    copy[name] = record;
  }
}
for (const file of ['payments.json', 'banks.json', 'cards.json', 'wealth.json', 'lending.json']) {
  for (const [name, record] of Object.entries(read(file))) {
    if (evidence[name]) throw new Error(`Duplicate research: ${name}`);
    evidence[name] = record;
  }
}
const apps = register.apps.map((raw) => {
  const record = evidence[raw.name];
  if (!record) throw new Error(`Missing research: ${raw.name}`);
  const demographic = demographics[raw.name];
  if (!demographic || !Array.isArray(demographic.items)) throw new Error(`Missing demographics: ${raw.name}`);
  const audienceRecord = audiences[raw.name];
  if (!audienceRecord?.primary || !Array.isArray(audienceRecord.secondary)) throw new Error(`Missing intended audience: ${raw.name}`);
  const audienceProfile = profiles[raw.name];
  if (!audienceProfile?.headline || !Array.isArray(audienceProfile.dimensions) || !Array.isArray(audienceProfile.tags)) throw new Error(`Missing audience profile: ${raw.name}`);
  const sources = [...record.sources, ...demographic.sources, ...audienceRecord.sources, ...audienceProfile.sources];
  const display = copy[raw.name];
  if (!display || !display.summary || !Array.isArray(display.requirements) || !Array.isArray(display.notes)) throw new Error(`Missing display copy: ${raw.name}`);
  const sourceIds = new Set(sources.map((s) => s.id));
  if (!sourceIds.size || sourceIds.size !== sources.length) throw new Error(`Invalid sources: ${raw.name}`);
  for (const source of sources) {
    if (!source.title || !source.publisher || !source.supports || !/^https:\/\//.test(source.url) || !/^\d{4}-\d{2}-\d{2}$/.test(source.checked)) {
      throw new Error(`Incomplete source: ${raw.name}/${source.id}`);
    }
  }
  for (const claim of record.claims) {
    if (!claim.sources.length || claim.sources.some((id) => !sourceIds.has(id))) throw new Error(`Uncited claim: ${raw.name}/${claim.label}`);
  }
  for (const item of [{ sources: display.summarySources }, ...display.requirements]) {
    if (!item.sources?.length || item.sources.some((id) => !sourceIds.has(id))) throw new Error(`Uncited display copy: ${raw.name}`);
  }
  for (const item of demographic.items) {
    if (!item.sources?.length || item.sources.some((id) => !sourceIds.has(id))) throw new Error(`Uncited demographic: ${raw.name}`);
    if (!['reported', 'audience', 'eligibility'].includes(item.kind)) throw new Error(`Invalid demographic kind: ${raw.name}`);
    if (item.kind === 'reported' && (!item.period || !item.population || !item.measure)) throw new Error(`Missing demographic scope: ${raw.name}`);
    if (item.kind === 'eligibility' && item.tags.length) throw new Error(`Eligibility cannot define an audience: ${raw.name}`);
  }
  for (const item of [audienceRecord.primary, ...audienceRecord.secondary]) {
    if (!item.label || !item.text || !Array.isArray(item.tags) || !['explicit', 'interpretation'].includes(item.basis)) throw new Error(`Invalid audience: ${raw.name}`);
    if (!item.sources?.length || item.sources.some((id) => !sourceIds.has(id))) throw new Error(`Uncited audience: ${raw.name}`);
  }
  const dimensions = ['age', 'location', 'employment', 'income', 'gender'];
  if (audienceProfile.dimensions.length !== dimensions.length || new Set(audienceProfile.dimensions.map((item) => item.key)).size !== dimensions.length) throw new Error(`Incomplete audience profile: ${raw.name}`);
  for (const item of audienceProfile.dimensions) {
    if (!dimensions.includes(item.key) || !item.value || !item.reason || !['inferred', 'stated'].includes(item.basis)) throw new Error(`Invalid profile dimension: ${raw.name}`);
    if (!item.sources?.length || item.sources.some((id) => !sourceIds.has(id))) throw new Error(`Uncited profile dimension: ${raw.name}/${item.key}`);
  }
  if (!record.summary || !record.claims.length) throw new Error(`Incomplete record: ${raw.name}`);
  if (raw.cit.concat(raw.b2c, raw.b2b, raw.onus, raw.total).some((v) => !Number.isFinite(v) || v < 0)) throw new Error(`Invalid numbers: ${raw.name}`);
  const { audience, summary, claims, unknowns, ...published } = record;
  return { ...raw, ...published, sources, display, audienceProfile: { headline: audienceProfile.headline, tags: audienceProfile.tags, dimensions: audienceProfile.dimensions, caveats: audienceProfile.caveats || [] }, intendedAudience: { primary: audienceRecord.primary, secondary: audienceRecord.secondary }, eligibility: demographic.items.filter((item) => item.kind === 'eligibility'), tpap: raw.originalName.includes('#') };
});
if (apps.length !== 92 || new Set(apps.map((a) => a.slug)).size !== apps.length) throw new Error('Invalid register size or duplicate slugs');
if (Object.keys(evidence).some((name) => !apps.some((a) => a.name === name))) throw new Error('Research contains an unmatched app');
if (Object.keys(audiences).length !== apps.length || Object.keys(audiences).some((name) => !apps.some((a) => a.name === name))) throw new Error('Intended audiences do not match the register');
if (Object.keys(profiles).length !== apps.length || Object.keys(profiles).some((name) => !apps.some((a) => a.name === name))) throw new Error('Audience profiles do not match the register');
const output = `// Generated by npm run build. Edit research/*.json, then rebuild.\nexport { TYPES, BANK_SUBS, DEMOGRAPHIC_DIMENSIONS, PROFILE_DIMENSIONS, DEMOGRAPHIC_GROUPS, DEMOGRAPHIC_FILTERS, GATES } from './catalog.js';\nexport const MONTH = ${JSON.stringify(register.month)};\nexport const APPS = ${JSON.stringify(apps, null, 2)};\nexport const OTHERS = ${JSON.stringify(register.others)};\n`;
fs.writeFileSync(path.join(root, 'public/data.js'), output);
const dataset = {
  checked: '2026-11-09', statisticsMonth: register.month,
  notes: read('audience-study.json').notes,
  apps: apps.map(({ name, slug, type, sub, originalName, row, cit, b2c, b2b, onus, total, display, audienceProfile, intendedAudience, eligibility, sources }) => ({ name, slug, type, sub, originalName, row, statistics: { cit, b2c, b2b, onus, total }, description: display.summary, audienceProfile, intendedAudience, requirements: display.requirements, eligibility, notes: display.notes, sources })),
};
fs.writeFileSync(path.join(root, 'public/research-data.json'), JSON.stringify(dataset, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'public/study.js'), `// Generated by npm run build.\nexport const STUDY = ${JSON.stringify(read('audience-study.json'), null, 2)};\n`);
console.log(`Built ${apps.length} profiles; ${apps.reduce((n, a) => n + a.sources.length, 0)} source references, every factual claim cited.`);
