import { APPS, OTHERS, TYPES, BANK_SUBS } from './data.js';
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const nf = (n, d = 0) => n.toLocaleString('en-IN', { maximumFractionDigits: d, minimumFractionDigits: d });
export function fmtVol(mn) {
  if (mn >= 1000) return `${nf(mn / 1000, 2)} bn`;
  if (mn >= 10) return `${nf(mn, 1)} mn`;
  if (mn >= 0.1) return `${nf(mn, 2)} mn`;
  if (mn > 0) return `${nf(mn * 1000)} thousand`;
  return '0';
}
export function fmtVal(cr) {
  if (cr >= 100000) return `₹${nf(cr / 100000, 2)} lakh cr`;
  if (cr >= 1) return `₹${nf(cr)} cr`;
  if (cr > 0) return `₹${nf(cr * 100)} lakh`;
  return '₹0';
}
export const fmtTicket = (r) => r ? `₹${nf(r)}` : 'n/a';
export const pct = (x, d = 1) => `${nf(x * 100, d)}%`;
export const sharePct = (x) => x > 0 && x < 0.00001 ? '<0.001%' : pct(x, x < 0.0001 ? 3 : x < 0.01 ? 2 : 1);
export const apps = APPS.map((a) => ({ ...a, id: a.slug, vol: a.total[0], val: a.total[1], ticket: a.total[0] ? a.total[1] * 10 / a.total[0] : 0, license: a.sub ? 'bank' : a.tpap ? 'marked' : 'unmarked' }));
[...apps].sort((a, b) => b.vol - a.vol).forEach((a, i) => { a.rank = i + 1; });
export const TOTAL_VOL = apps.reduce((s, a) => s + a.vol, 0) + OTHERS.total[0];
export const TOTAL_VAL = apps.reduce((s, a) => s + a.val, 0) + OTHERS.total[1];
export const share = (a) => a.vol / TOTAL_VOL;
export const subLine = (a) => a.sub ? BANK_SUBS[a.sub] : TYPES[a.type].label;
export const appHref = (a) => `app.html?id=${encodeURIComponent(a.slug)}`;
export const sourceCount = (a) => a.sources.length + 1;
export const audienceTags = (a) => a.audienceProfile.tags;
