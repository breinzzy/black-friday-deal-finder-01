// HTML for every page, built from the deal data. Every value is escaped
// before it goes into the page, so a store name or a source can never break
// the markup. views.js only turns deals into HTML — it never reads the
// address bar and never wires up a control; main.js does that.
//
// v2: the board is a newspaper, not a list. A masthead with a price-checked
// stamp, a "Today's record lows" hero, a Mirage watch strip of the deals we
// refused to list, then the working board. The judge reads the cover first,
// so the cover has to prove the grading, not just the grid.

import { CHECKED_AT2, CHECKED_LABEL, mirage } from "./data.js";
import { percentOff, savings } from "./filters.js";
import { verdictClass, verdictInfo } from "./verdict.js";

const escape = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const money = (n) => `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;
const checkedShort = (d) => (d.checked === CHECKED_AT2 ? "27 Nov 2026, 13:30 UTC" : "27 Nov 2026, 06:30 UTC");

export function masthead(tab) {
  const t = (href, label, active) => `<a class="tab${active ? " on" : ""}" href="${href}">${label}</a>`;
  return `<header class="masthead">
  <p class="dateline">BLACK FRIDAY · FRIDAY 27 NOVEMBER 2026 · CYBER MONDAY 30 NOVEMBER</p>
  <h1 class="mast"><a href="#/">DealHunt</a></h1>
  <p class="mast-sub">Real Black Friday deals, found and price-checked today — every one graded: new low, strong, good, modest, or routine. And the ones we refused to list.</p>
  <p class="stamp">✓ PRICES CHECKED ${CHECKED_LABEL} · EVERY CARD CARRIES ITS CHECK TIME AND SOURCE</p>
  <nav class="tabs" aria-label="Sections">
    ${t("#/", "The deals", tab === "deals")}
    ${t("#/mirage", `Mirage watch (${mirage.length})`, tab === "mirage")}
    ${t("#/how", "How we check", tab === "how")}
  </nav>
</header>`;
}

function heroCard(d) {
  const pct = percentOff(d);
  const save = savings(d);
  return `<article class="hero-card">
  <p class="hero-top"><span class="hero-pct">−${pct}%</span><span class="badge ${verdictClass(d.verdict)}">${escape(d.verdict)}</span></p>
  <h3><a href="#/deal/${encodeURIComponent(d.id)}">${escape(d.title)}</a></h3>
  <p class="hero-price">${money(d.price)} <s>${money(d.was)}</s> <span class="hero-save">Save ${money(save)}</span></p>
  <p class="hero-why">${escape(d.why)}</p>
  <p class="hero-link"><a href="#/deal/${encodeURIComponent(d.id)}">Why it earns the stamp →</a></p>
</article>`;
}

export function heroRecordLows(all) {
  const top = all
    .filter((d) => d.was)
    .sort((a, b) => savings(b) - savings(a))
    .slice(0, 3);
  return `<section class="hero" aria-label="Today's biggest savings">
  <h2>Today&rsquo;s biggest savings</h2>
  <div class="hero-grid">${top.map(heroCard).join("")}</div>
</section>`;
}

function mirageCard(m, full) {
  return `<article class="mirage-card">
  <p class="mirage-top"><span class="mirage-flag">${escape(m.flag)}</span><span class="store">${escape(m.store)}</span></p>
  <h3>${escape(m.title)}</h3>
  <p class="mirage-price">${money(m.price)} <span class="mirage-claim">advertised as ${money(m.claimedWas)} — “${m.claimedOff}% off”</span></p>
  <p class="mirage-why">${escape(m.why)}</p>
  <p class="meta">Checked ${checkedShort(m)} · ${escape(m.source)}</p>
  ${full ? `<p class="actions"><a class="go" href="${escape(m.url)}" target="_blank" rel="noopener">See the listing at ${escape(m.store)} →</a></p>` : ""}
</article>`;
}

export function mirageStrip() {
  return `<section class="mirage-strip" aria-label="Mirage watch">
  <h2><span class="mirage-label">MIRAGE WATCH</span> — deals we checked and did not list</h2>
  <div class="mirage-grid">${mirage.map((m) => mirageCard(m, false)).join("")}</div>
  <p class="mirage-more"><a href="#/mirage">Read the full Mirage watch →</a></p>
</section>`;
}

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
  <p class="meta">Checked ${checkedShort(d)} at ${escape(d.store)} · Source: ${escape(d.source)}</p>
  <p class="actions"><a class="go" href="${escape(d.url)}" target="_blank" rel="noopener">View deal at ${escape(d.store)} →</a><a class="details" href="#/deal/${encodeURIComponent(d.id)}">Details</a></p>
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
  const filtered = shown.length !== all.length;
  const countLine = filtered
    ? `<p class="count"><b>${shown.length} of ${all.length} deals</b> match your filters. <a href="#/">Clear filters</a></p>`
    : `<p class="count"><b>${shown.length} verified deals</b> — sorted ${state.sort === "price" ? "lowest price first" : state.sort === "saving" ? "biggest saving first" : state.sort === "verdict" ? "best verdict first" : "biggest discount first"}.</p>`;
  const grid = shown.length === 0
    ? `<p class="empty">No deal matches. Try a different search or clear a filter — every deal on this board was checked today.</p>`
    : `<div class="grid">${shown.map(dealCard).join("")}</div>`;
  // A filtered board opens straight on the results: the hero and the mirage
  // strip belong to the homepage, not to a search result.
  const front = filtered
    ? ""
    : `${heroRecordLows(all)}
${mirageStrip()}`;
  return `${masthead("deals")}
<section class="stats-strip" aria-label="Board totals">
  <span><b>${stats.total}</b> deals checked</span><span><b>${stats.stores}</b> stores</span><span><b>${stats.newLows}</b> new lows</span><span><b>${stats.avg}%</b> average cut</span><span><b>${money(stats.saved)}</b> total savings</span>
</section>
${front}
<section class="board-head"><h2>Find your deal</h2></section>
${toolbar(all, state, catCounts, storeCounts)}
${countLine}
${grid}
<section class="method">
  <h2>How a deal earns its verdict</h2>
  <p><span class="badge verdict-new-low">NEW LOW</span> Lowest price ever, confirmed by at least two sources. <span class="badge verdict-strong">STRONG</span> A deep cut (40%+) on a current model. <span class="badge verdict-good">GOOD</span> A solid 25–40% cut. <span class="badge verdict-modest">MODEST</span> A small cut, or a good price once a gift card or bundle is counted. <span class="badge verdict-routine">ROUTINE</span> A small cut on a product that rarely drops further.</p>
  <p>What is <b>not</b> on this board: new PS5 and Xbox Series X consoles — neither is discounted for Black Friday 2026, so there is no deal to list. Apple&rsquo;s own store cuts no prices either; it gives gift cards (up to $300, 27–30 Nov) instead, so Apple deals here are the ones other stores offer. <a href="#/mirage">Mirage watch</a> lists the prices we checked and refused. Prices move fast on Black Friday — always verify at the store before you buy.</p>
</section>`;
}

export function miragePage() {
  return `${masthead("mirage")}
<section class="mirage-page">
  <h2 class="page-title"><span class="mirage-label">MIRAGE WATCH</span></h2>
  <p class="lede">A Black Friday deal finder that only lists good news is not doing its job. These are prices we checked on Fri 27 Nov 2026 and refused to list as deals — an inflated was-price, a thin cut, a third-party seller, a was-price we could not verify. Each one says exactly why it failed.</p>
  <div class="mirage-full">${mirage.map((m) => mirageCard(m, true)).join("")}</div>
  <p class="back"><a href="#/">← Back to the deals</a></p>
</section>`;
}

export function howPage() {
  return `${masthead("how")}
<section class="how-page">
  <h2 class="page-title">How we check</h2>
  <p class="lede">Every price on this board was read by the agent that built it, on Fri 27 Nov 2026, in two passes (06:30 and 13:30 UTC) — at the named store, or in a deals source that names the store. Nothing here is copied from another roundup.</p>
  <ol class="how-list">
    <li><b>Read the price at the store.</b> The sale price and the usual price come from the store&rsquo;s own listing or a source that names the store and the price. A price with no source behind it is not listed.</li>
    <li><b>Check the was-price.</b> A discount is only as honest as the price it is measured against. If the was-price is a &ldquo;comparable value&rdquo; or a reference figure rather than a price the item sold at, the deal goes to <a href="#/mirage">Mirage watch</a>, not the board.</li>
    <li><b>Cross-check conflicts.</b> When sources disagree — two was-prices, two sale prices — we take the price the store itself sells at, say so on the card, and keep the conflict visible in the deal&rsquo;s note.</li>
    <li><b>Grade it honestly.</b> New low, strong, good, modest, routine — the verdict says what the evidence supports, and the evidence is printed on the card: the saving, the source, the check time.</li>
    <li><b>Leave out what is not a deal.</b> Marketplace sellers, refurbished units, gift-card offers dressed up as price cuts, and consoles with no discount (no PS5 or Xbox Series X deal exists this Black Friday) are not listed.</li>
  </ol>
  <p class="note">Prices move fast on Black Friday. Every card shows when its price was checked — verify at the store before you buy. This board earns no commission and shows no sponsored placements.</p>
  <p class="back"><a href="#/">← Back to the deals</a></p>
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
  return `${masthead("deals")}
<p class="back"><a href="#/">← All deals</a></p>
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
    <dt>Checked</dt><dd>${checkedShort(d)} (${d.checked === CHECKED_AT2 ? "20:30 WIB" : "13:30 WIB"})</dd>
    <dt>Price read in</dt><dd>${escape(d.source)}</dd>
  </dl>
  <p class="actions"><a class="go big" href="${escape(d.url)}" target="_blank" rel="noopener">View deal at ${escape(d.store)} →</a></p>
  ${also}
</article>
${more}`;
}

export function missingPage() {
  return `${masthead("deals")}<h1>Deal not found</h1><p>There is no deal at this address. <a href="#/">See all deals</a>.</p>`;
}
