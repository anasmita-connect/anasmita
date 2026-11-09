import { MONTH, TYPES, BANK_SUBS, DEMOGRAPHIC_GROUPS, DEMOGRAPHIC_FILTERS, GATES } from "./data.js";
import { apps, TOTAL_VOL, esc, fmtVol, fmtVal, fmtTicket, pct, sharePct, share, subLine, appHref, sourceCount, audienceTags } from "./format.js";
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const LICENSES = { marked: "Marked # in source table", bank: "Bank aggregate row", unmarked: "Unmarked row" };

/* ---------- static text ---------- */
$$("[data-month]").forEach((el) => (el.textContent = MONTH));
$("#q").placeholder = `Search ${apps.length} apps`;

/* ---------- tooltip ---------- */
const tip = $("#tip");
function showTip(html, x, y) {
  tip.innerHTML = html;
  tip.hidden = false;
  const r = tip.getBoundingClientRect();
  let left = x + 14, top = y + 14;
  if (left + r.width > innerWidth - 8) left = x - r.width - 14;
  if (top + r.height > innerHeight - 8) top = y - r.height - 14;
  tip.style.left = `${Math.max(8, left)}px`;
  tip.style.top = `${Math.max(8, top)}px`;
}
const hideTip = () => (tip.hidden = true);
const appTip = (a) =>
  `<strong>${esc(a.name)}</strong><span>${esc(subLine(a))}</span><br>${fmtVol(a.vol)} transactions, ${sharePct(share(a))} of supplied table<br>${fmtVal(a.val)} moved, avg ${fmtTicket(a.ticket)}`;
function bindTip(el, html) {
  el.addEventListener("pointermove", (e) => showTip(html(), e.clientX, e.clientY));
  el.addEventListener("pointerleave", hideTip);
  el.addEventListener("focus", () => { const r = el.getBoundingClientRect(); showTip(html(), r.left + r.width / 2, r.bottom); });
  el.addEventListener("blur", hideTip);
}
addEventListener("scroll", hideTip, { passive: true });

/* ---------- state & filters ---------- */
const state = {
  types: new Set(), audience: new Set(), gates: new Set(), subs: new Set(), license: new Set(),
  q: "", sort: "vol", view: "ledger",
};

function matchesAudience(a, ignoreTag) {
  const tags = audienceTags(a);
  return Object.values(DEMOGRAPHIC_GROUPS).every((options) => {
    if (ignoreTag && ignoreTag in options) return true;
    const selected = Object.keys(options).filter((key) => state.audience.has(key));
    return !selected.length || selected.some((key) => tags.includes(key));
  });
}

function matches(a, skip) {
  if (skip !== "types" && state.types.size && !state.types.has(a.type)) return false;
  if (skip !== "audience" && !matchesAudience(a)) return false;
  if (skip !== "gates" && state.gates.size && !a.gates.some((x) => state.gates.has(x))) return false;
  if (skip !== "subs" && state.subs.size && !state.subs.has(a.sub)) return false;
  if (skip !== "license" && state.license.size && !state.license.has(a.license)) return false;
  if (state.q) {
    const hay = `${a.name} ${a.originalName} ${a.display.summary || ""} ${a.intendedAudience.primary.label} ${subLine(a)}`.toLowerCase();
    if (!state.q.split(/\s+/).every((t) => hay.includes(t))) return false;
  }
  return true;
}

function renderTypes() {
  const wrap = $("#types");
  wrap.innerHTML = Object.entries(TYPES).map(([k, t]) => {
    const list = apps.filter((a) => a.type === k);
    if (!list.length) return "";
    const s = list.reduce((n, a) => n + a.vol, 0) / TOTAL_VOL;
    return `<button type="button" class="type-btn" data-type="${k}" aria-pressed="false" style="--c:${t.color}">
      <span class="sw"></span><span class="nm">${esc(t.label)}</span><span class="ct">${list.length}</span>
      <span class="sh">${pct(s, s < 0.01 ? 2 : 1)} of transactions</span>
      <span class="bar"><i style="width:${Math.max(s * 100, 0.6)}%"></i></span>
    </button>`;
  }).join("");
  $$(".type-btn", wrap).forEach((b) => {
    b.addEventListener("click", () => toggle(state.types, b.dataset.type));
    bindTip(b, () => `<strong>${esc(TYPES[b.dataset.type].label)}</strong>${esc(TYPES[b.dataset.type].blurb)}`);
  });
}

function checkGroup(id, key, options) {
  const el = $(id);
  el.innerHTML = Object.entries(options).map(([k, label]) =>
    `<label class="check"><input type="checkbox" value="${k}"><span class="l">${esc(label)}</span><span class="n" data-n="${k}"></span></label>`
  ).join("");
  $$("input", el).forEach((i) => i.addEventListener("change", () => toggle(state[key], i.value)));
}

function toggle(set, v) {
  set.has(v) ? set.delete(v) : set.add(v);
  render();
}

function syncControls() {
  const counts = {
    audience: (k) => apps.filter((a) => matches(a, "audience") && matchesAudience(a, k) && audienceTags(a).includes(k)).length,
    gates: (k) => apps.filter((a) => matches(a, "gates") && a.gates.includes(k)).length,
    subs: (k) => apps.filter((a) => matches(a, "subs") && a.sub === k).length,
    license: (k) => apps.filter((a) => matches(a, "license") && a.license === k).length,
  };
  for (const [id, key] of [["#f-audience", "audience"], ["#f-gates", "gates"], ["#f-subs", "subs"], ["#f-license", "license"]]) {
    $$("input", $(id)).forEach((i) => {
      i.checked = state[key].has(i.value);
      const n = counts[key](i.value);
      $(`[data-n="${i.value}"]`, $(id)).textContent = n;
      i.closest(".check").style.opacity = n || i.checked ? 1 : 0.45;
    });
  }
  $$(".type-btn").forEach((b) => b.setAttribute("aria-pressed", state.types.has(b.dataset.type)));
  $("#types").classList.toggle("has-active", state.types.size > 0);
  const n = state.types.size + state.audience.size + state.gates.size + state.subs.size + state.license.size;
  const pill = $("#filter-count");
  pill.hidden = !n;
  pill.textContent = n;
  $$(".seg button").forEach((b) => b.setAttribute("aria-checked", b.dataset.view === state.view));
}

function sorted(list) {
  const by = {
    vol: (a, b) => b.vol - a.vol,
    val: (a, b) => b.val - a.val,
    ticket: (a, b) => b.ticket - a.ticket,
    name: (a, b) => a.name.localeCompare(b.name),
  }[state.sort];
  return [...list].sort(by);
}

/* ---------- ledger ---------- */
const audText = (a) => a.audienceProfile.headline;
function rowHTML(a, maxVol) {
  const c = TYPES[a.type].color;
  const w = Math.max((a.vol / maxVol) * 100, 0.5);
  return `<div class="row" role="listitem" style="--c:${c}">
    <a class="row-head" href="${appHref(a)}" aria-label="${esc(a.name)} — details and sources">
      <span class="rk">${a.rank}</span>
      <span class="who">
        <span class="name"><span class="dot"></span>${esc(a.name)}${a.tpap ? ' <span class="tpap" title="Marked # in the supplied table">#</span>' : ""}</span>
        <span class="sub">${esc(subLine(a))}</span>
        <span class="demographic-hint">${esc(audText(a))}</span>
        <span class="source-hint">${sourceCount(a)} sources <span aria-hidden="true">→</span></span>
      </span>
      <span class="aud">${esc(audText(a))}</span>
      <span class="vol"><span class="num">${fmtVol(a.vol)} <small>${sharePct(share(a))}</small></span><span class="track"><i style="width:${w}%"></i></span></span>
      <span class="tk">${fmtTicket(a.ticket)}<small>avg payment</small></span>
    </a>
  </div>`;
}

function renderLedger(list) {
  const maxVol = Math.max(...list.map((a) => a.vol)) || 1;
  $("#ledger").innerHTML = `<div class="ledger-heading" aria-hidden="true"><span></span><span>App</span><span class="aud">Audience estimate</span><span>Transactions</span><span class="tk">Average</span></div>` + list.map((a) => rowHTML(a, maxVol)).join("");
}

/* ---------- map ---------- */
function renderMap(list) {
  const groups = Object.keys(TYPES).map((k) => [k, list.filter((a) => a.type === k)]).filter(([, l]) => l.length);
  $("#map").innerHTML = groups.map(([k, l]) => {
    const t = TYPES[k];
    const vol = l.reduce((s, a) => s + a.vol, 0);
    return `<div class="cluster" style="--c:${t.color}">
      <h3><span class="sw"></span>${esc(t.label)}</h3>
      <p>${esc(t.blurb)} ${l.length} ${l.length === 1 ? "app" : "apps"}, ${fmtVol(vol)} transactions.</p>
      <div class="beads">${[...l].sort((a, b) => b.vol - a.vol).map((a) => {
        const s = Math.round(14 + 13 * Math.max(0, Math.log10(a.vol) + 2));
        return `<a class="bead" href="${appHref(a)}" data-id="${a.id}" style="--s:${s}px" aria-label="${esc(a.name)} — details and sources"><span class="o"></span><span class="l">${esc(a.name)}</span></a>`;
      }).join("")}</div>
    </div>`;
  }).join("");
  $$(".bead").forEach((b) => {
    const a = apps.find((x) => x.id === b.dataset.id);
    bindTip(b, () => appTip(a));
    b.addEventListener("click", hideTip);
  });
}

/* ---------- render ---------- */
function render() {
  syncControls();
  const list = sorted(apps.filter((a) => matches(a)));
  const vol = list.reduce((s, a) => s + a.vol, 0);
  $("#count").textContent = list.length === apps.length
    ? `All ${apps.length} apps, ranked by ${$("#sort").selectedOptions[0].text.toLowerCase()}.`
    : `${list.length} of ${apps.length} apps, carrying ${sharePct(vol / TOTAL_VOL)} of transactions in the supplied table.`;
  if (state.view === "map") $("#count").textContent += " Circles grow with transactions on a log scale, so small apps stay visible.";
  $("#empty").hidden = list.length > 0;
  $("#ledger").hidden = state.view !== "ledger" || !list.length;
  $("#map").hidden = state.view !== "map" || !list.length;
  if (state.view === "ledger") renderLedger(list); else renderMap(list);
}

function resetFilters(rerender = true) {
  for (const k of ["types", "audience", "gates", "subs", "license"]) state[k].clear();
  state.q = "";
  $("#q").value = "";
  if (rerender) render();
}

/* ---------- wire up ---------- */
renderTypes();
const demographicWrap = $("#f-audience");
demographicWrap.innerHTML = Object.entries(DEMOGRAPHIC_GROUPS).map(([label, options]) => `<div class="demographic-group"><h3>${esc(label)}</h3>${Object.entries(options).map(([key, text]) => `<label class="check"><input type="checkbox" value="${key}"><span class="l">${esc(text)}</span><span class="n" data-n="${key}"></span></label>`).join("")}</div>`).join("");
$$("input", demographicWrap).forEach((input) => input.addEventListener("change", () => toggle(state.audience, input.value)));
checkGroup("#f-gates", "gates", GATES);
checkGroup("#f-subs", "subs", BANK_SUBS);
checkGroup("#f-license", "license", LICENSES);

let qt;
$("#q").addEventListener("input", (e) => { clearTimeout(qt); qt = setTimeout(() => { state.q = e.target.value.trim().toLowerCase(); render(); }, 90); });
$("#sort").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
$$(".seg button").forEach((b) => b.addEventListener("click", () => { state.view = b.dataset.view; render(); }));
$("#reset").addEventListener("click", () => resetFilters());
$("[data-reset]").addEventListener("click", () => resetFilters());
if (matchMedia("(max-width: 860px)").matches) $(".rail-toggle").open = false;

render();
