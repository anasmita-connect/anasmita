import assert from 'node:assert/strict';
import fs from 'node:fs';
import { APPS, TYPES, DEMOGRAPHIC_DIMENSIONS, DEMOGRAPHIC_FILTERS, GATES } from '../public/data.js';
import { apps, TOTAL_VOL, TOTAL_VAL, appHref } from '../public/format.js';

const raw = JSON.parse(fs.readFileSync(new URL('../research/register.json', import.meta.url)));
assert.equal(APPS.length, 92);
assert.equal(new Set(APPS.map((a) => a.slug)).size, 92);
for (const app of APPS) {
  const original = raw.apps.find((r) => r.row === app.row);
  for (const field of ['cit', 'b2c', 'b2b', 'onus', 'total', 'originalName']) assert.deepEqual(app[field], original[field], `${app.name}: changed source ${field}`);
  assert.ok(TYPES[app.type], `${app.name}: unknown type ${app.type}`);
  assert.ok(!('audience' in app), `${app.name}: legacy use cases presented as demographics`);
  assert.ok(app.gates.every((k) => GATES[k]), `${app.name}: unknown requirement`);
  assert.ok(app.sources.length > 0, `${app.name}: no sources`);
  const sourceIds = new Set(app.sources.map((s) => s.id));
  assert.equal(sourceIds.size, app.sources.length, `${app.name}: duplicate source IDs`);
  for (const item of [{ sources: app.display.summarySources }, ...app.display.requirements, ...app.eligibility, app.intendedAudience.primary, ...app.intendedAudience.secondary]) assert.ok(item.sources.length && item.sources.every((id) => sourceIds.has(id)), `${app.name}: missing display source`);
  for (const item of app.eligibility) {
    assert.ok(DEMOGRAPHIC_DIMENSIONS[item.dimension], `${app.name}: invalid demographic dimension`);
    assert.equal(item.kind, 'eligibility', `${app.name}: audience and eligibility mixed`);
    assert.equal(item.tags.length, 0, `${app.name}: eligibility used as an audience`);
  }
  for (const item of [app.intendedAudience.primary, ...app.intendedAudience.secondary]) {
    assert.ok(item.label && item.text, `${app.name}: missing intended audience`);
    assert.ok(['explicit', 'interpretation'].includes(item.basis), `${app.name}: invalid audience basis`);
  }
  const profile = app.audienceProfile;
  assert.ok(profile.tags.length >= 2 && profile.tags.every((tag) => DEMOGRAPHIC_FILTERS[tag]), `${app.name}: invalid profile tags`);
  assert.ok(!/broad audience|mixed consumer|everyone/i.test(profile.headline), `${app.name}: vague headline`);
  assert.deepEqual(profile.dimensions.map((d) => d.key), ['age', 'location', 'employment', 'income', 'gender'], `${app.name}: profile dimensions`);
  for (const d of profile.dimensions) assert.ok(d.sources.length && d.sources.every((id) => sourceIds.has(id)), `${app.name}: uncited ${d.key}`);
  for (const source of app.sources) {
    assert.equal(new URL(source.url).protocol, 'https:');
    assert.ok(source.checked <= '2026-11-09', `${app.name}: future source check`);
  }
  assert.ok(!('entry' in app) && !('confidence' in app) && !('note' in app), `${app.name}: legacy unsourced description`);
  const display = apps.find((a) => a.slug === app.slug);
  assert.equal(display.vol, app.total[0]);
  assert.equal(display.val, app.total[1]);
  assert.equal(new URL(appHref(app), 'https://example.test').searchParams.get('id'), app.slug);
}
assert.ok(TOTAL_VOL > 0 && TOTAL_VAL > 0);
assert.ok(!APPS.find((a) => a.name === 'Google Pay').audienceProfile.tags.includes('teens'));
assert.ok(fs.readFileSync(new URL('../public/sources/upi-applications-2026-08.pdf', import.meta.url)).subarray(0, 5).equals(Buffer.from('%PDF-')));
console.log('Passed: 92 profiles, original figures/markers, published totals, source references, filter tags and detail links.');
