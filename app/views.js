// HTML for every page, built from the deal data. Every value is escaped
// before it goes into the page, so a store name or a source can never break
// the markup. views.js only turns deals into HTML — it never reads the
// address bar and never wires up a control; main.js does that.

import { CHECKED_LABEL } from "./data.js";
import { percentOff, savings } from "./filters.js";
import { verdictClass, verdictInfo } from "./verdict.js";

const escape = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const money = (n) => `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;
const checkedShort = "27 Nov 2026, 06:30 UTC";

function priceLine(d) {
  const suffix = d.perMonth ? "/mo" : "";
  const pct = percentOff(d);
  const save = savings(d);
  const was = d.was
    ? `<s class="was">${money(d.was)}${suffix}</s>`
    : `<span class="was-none">no usual price published</span>`;
  const pctBadge = pct === null ? "" : `<span class="pct">−${pct}%</span>`;
  const saveLine = save === null ? "" : `<span class="save">Save ${money(save)}${suffix === "/mo" ? " a month" : ""}</span>`;
  return `<p class="price">${money(d.price)}${suffix} ${was} ${pctBadge}</p><p class="save-line">${saveLine}</p>`;
}

export function dealCard(d) {
  const v = verdictInfo(d.verdict);
  return `<article class="card">
  <p class="card-top"><span class="store">${escape(d.store)}</span><span class="cat">${escape(d.category)}</span><span class="badge ${verdictClass(d.verdict)}" title="${escape(v.blurb)}">${escape(d.verdict)}</span></p>
  <h3><a href="#/deal/${encodeURIComponent(d.id)}">${escape(d.title)}</a></h3>
  ${priceLine(d)}
  <p class="why">${escape(d.why)}</p>
  <p class="meta">Checked ${checkedShort} · ${escape(d.source)}</p>
  <p class="actions"><a class="go" href="${escape(d.url)}" target="_blank" rel="noopener">View at ${escape(d.store)} →</a><a class="details" href="#/deal/${encodeURIComponent(d.id)}">Details</a></p>
</article>`;
}

function chip(cat, count, active) {
  const href = cat === "All" ? "#/" : `#/?cat=${encodeURIComponent(cat)}`;
  return `<a class="chip${active ? " on" : ""}" href="${href}">${escape(cat)} <b>${count}</b></a>`;
}

export function toolbar(all, state, catCounts, storeCounts) {
  const cats = ["All", ...[...catCounts.keys()].sort()];
  const total = all.length;
  const stores = ["All", ...[...storeCounts.keys()].sort()];
  const opt = (value, current, label) => `<option value="${escape(value)}"${value === current ? " selected" : ""}>${escape(label)}</option>`;
  return `<section class="toolbar" aria-label="Search and filters">
  <p class="search-row"><label>Search deals <input id="q" type="search" placeholder="Try “AirPods”, “OLED”, “Dyson”…" value="${escape(state.q ?? "")}"></label></p>
  <p class="chips" aria-label="Filter by category">${cats.map((c) => chip(c, c === "All" ? total : catCounts.get(c) ?? 0, (state.cat ?? "All") === c)).join("")}</p>
  <p class="selects">
    <label>Store <select id="store">${stores.map((s) => opt(s, state.store ?? "All", s)).join("")}</select></label>
    <label>Min. discount <select id="min">${[0, 25, 40, 50].map((m) => opt(String(m), String(state.min ?? 0), m === 0 ? "Any discount" : `${m}% off or more`)).join("")}</select></label>
    <label>Sort <select id="sort">${opt("discount", state.sort ?? "discount", "Biggest discount first")}${opt("saving", state.sort ?? "discount", "Biggest $ saving first")}${opt("price", state.sort ?? "discount", "Lowest price first")}${opt("verdict", state.sort ?? "discount", "Best verdict first")}</select></label>
  </p>
</section>`;
}

export function listPage(all, shown, state, catCounts, storeCounts, stats) {
  const countLine =
    shown.length === all.length
      ? `<p class="count"><b>${shown.length} verified deals</b> — sorted ${state.sort === "price" ? "lowest price first" : state.sort === "saving" ? "biggest saving first" : state.sort === "verdict" ? "best verdict first" : "biggest discount first"}.</p>`
      : `<p class="count"><b>${shown.length} of ${all.length} deals</b> match your filters. <a href="#/">Clear filters</a></p>`;
  const grid = shown.length === 0
    ? `<p class="empty">No deal matches. Try a different search or clear a filter — every deal on this board was checked today.</p>`
    : `<div class="grid">${shown.map(dealCard).join("")}</div>`;
  return `<section class="hero">
  <h1>Black Friday deals, checked today — not copied from a roundup.</h1>
  <p class="lede">Every price below was read at the store (or in a source that names the store) on ${CHECKED_LABEL}. Each deal carries an honest verdict: a real low, a strong cut, or a routine sale called what it is.</p>
  <p class="stats"><span><b>${stats.total}</b> verified deals</span><span><b>${stats.newLows}</b> new lows</span><span><b>up to ${stats.max}% off</b></span><span><b>${money(stats.saved)}</b> total savings</span></p>
</section>
${toolbar(all, state, catCounts, storeCounts)}
${countLine}
${grid}
<section class="method">
  <h2>How a deal earns its verdict</h2>
  <p><span class="badge verdict-new-low">NEW LOW</span> Lowest price ever, confirmed by at least two sources. <span class="badge verdict-strong">STRONG</span> A deep cut (40%+) on a current model. <span class="badge verdict-good">GOOD</span> A solid 25–40% cut. <span class="badge verdict-modest">MODEST</span> A small cut, or a good price once a gift card or bundle is counted. <span class="badge verdict-routine">ROUTINE</span> A small cut on a product that rarely drops further.</p>
  <p>What is <b>not</b> on this board: new PS5 and Xbox Series X consoles — neither is discounted for Black Friday 2026, so there is no deal to list. Apple's own store cuts no prices either; it gives gift cards (up to $300, 27–30 Nov) instead, so Apple deals here are the ones other stores offer. Prices move fast on Black Friday — always verify at the store before you buy.</p>
</section>`;
}

export function dealPage(d, siblings) {
  const v = verdictInfo(d.verdict);
  const pct = percentOff(d);
  const save = savings(d);
  const suffix = d.perMonth ? "/mo" : "";
  const math =
    pct === null
      ? `<p class="math">Priced at ${money(d.price)}${suffix} at ${escape(d.store)}. ${escape(d.store)} publishes no usual price for this item, so no discount is claimed.</p>`
      : `<p class="math">${money(d.price)}${suffix} is <b>${pct}% off</b> the usual ${money(d.was)}${suffix} — you save <b>${money(save)}</b>${suffix === "/mo" ? " every month" : ""}.</p>`;
  const also =
    d.also && d.also.length
      ? `<h2>Same product at another store</h2><ul class="also">${d.also.map((a) => `<li><b>${escape(a.store)}</b> — ${money(a.price)}${suffix} (${escape(a.when)}; ${escape(a.source)})</li>`).join("")}</ul>`
      : "";
  const note = d.note ? `<p class="note">${escape(d.note)}</p>` : "";
  const more =
    siblings.length === 0
      ? ""
      : `<h2>More ${escape(d.category)} deals</h2><div class="grid">${siblings.map(dealCard).join("")}</div>`;
  return `<p class="back"><a href="#/">← All deals</a></p>
<article class="detail">
  <p class="card-top"><span class="store">${escape(d.store)}</span><span class="cat">${escape(d.category)}</span><span class="badge ${verdictClass(d.verdict)}">${escape(d.verdict)}</span></p>
  <h1>${escape(d.title)}</h1>
  ${priceLine(d)}
  ${math}
  <h2>Why this verdict</h2>
  <p>${escape(d.why)}</p>
  <p class="scale">What ${escape(d.verdict)} means on this board: ${escape(v.blurb.toLowerCase())}</p>
  ${note}
  <dl class="facts">
    <dt>Store</dt><dd>${escape(d.store)}</dd>
    <dt>Checked</dt><dd>${CHECKED_LABEL} (13:30 WIB)</dd>
    <dt>Price read in</dt><dd>${escape(d.source)}</dd>
  </dl>
  <p class="actions"><a class="go big" href="${escape(d.url)}" target="_blank" rel="noopener">View at ${escape(d.store)} →</a></p>
  ${also}
</article>
${more}`;
}

export function missingPage() {
  return `<h1>Deal not found</h1><p>There is no deal at this address. <a href="#/">See all ${""}deals</a>.</p>`;
}
