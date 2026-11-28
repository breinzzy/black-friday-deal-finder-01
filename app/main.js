// DealHunt 2026 v3 — the wiring. main.js is the only file that touches the
// address bar and the page: it reads the hash into a filter state, asks
// filters.js for the deals that match, asks views.js for the HTML, and wires
// the search box and the selects back to the hash. Routes:
//
//   #/                                  the deal board (masthead + hero + mirage strip + board)
//   #/?q=airpods&cat=Audio&store=Target&min=40&sort=discount
//                                       the board, filtered
//   #/compare                           Compare prices — same product at several stores
//   #/mirage                            Mirage watch — the deals we refused to list
//   #/how                               How we check
//   #/deal/<id>                         one deal, with its verdict evidence
//
// window.__shotReady is false while a page renders and true once it is on
// screen, so a screenshot script knows when to capture.

import { CHECKED_LABEL, deals, CATEGORIES, STORES } from "./data.js";
import { applyFilters, countBy, maxDiscount, newLowCount, percentOff, totalSavings } from "./filters.js";
import { comparePage, dealPage, howPage, listPage, miragePage, missingPage } from "./views.js";

const app = document.getElementById("app");
const catCounts = countBy(deals, "category");
const storeCounts = countBy(deals, "store");
const cuts = deals.filter((d) => d.was).map((d) => percentOff(d));
const stats = {
  total: deals.length,
  newLows: newLowCount(deals),
  max: maxDiscount(deals),
  saved: Math.round(totalSavings(deals)),
  stores: STORES.length,
  avg: Math.round(cuts.reduce((a, b) => a + b, 0) / cuts.length),
};

function readState() {
  const raw = location.hash.replace(/^#\/?/, "");
  const params = new URLSearchParams(raw.startsWith("?") ? raw.slice(1) : "");
  const cat = params.get("cat") ?? "All";
  const store = params.get("store") ?? "All";
  return {
    q: params.get("q") ?? "",
    cat: CATEGORIES.includes(cat) ? cat : "All",
    store: STORES.includes(store) ? store : "All",
    min: ["0", "25", "40", "50"].includes(params.get("min") ?? "0") ? params.get("min") : "0",
    sort: ["discount", "saving", "price", "verdict"].includes(params.get("sort") ?? "discount")
      ? params.get("sort")
      : "discount",
  };
}

function writeState(state) {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.cat !== "All") params.set("cat", state.cat);
  if (state.store !== "All") params.set("store", state.store);
  if (state.min !== "0") params.set("min", state.min);
  if (state.sort !== "discount") params.set("sort", state.sort);
  const query = params.toString();
  location.hash = query ? `/?${query}` : "/";
}

function wireToolbar(state) {
  const q = document.getElementById("q");
  const store = document.getElementById("store");
  const min = document.getElementById("min");
  const sort = document.getElementById("sort");
  if (q) {
    q.addEventListener("input", () => {
      const next = { ...readState(), q: q.value };
      const params = new URLSearchParams();
      if (next.q) params.set("q", next.q);
      if (next.cat !== "All") params.set("cat", next.cat);
      if (next.store !== "All") params.set("store", next.store);
      if (next.min !== "0") params.set("min", next.min);
      if (next.sort !== "discount") params.set("sort", next.sort);
      history.replaceState(null, "", `#/${params.toString() ? `?${params.toString()}` : ""}`);
      render(false);
    });
    q.addEventListener("change", () => writeState({ ...readState(), q: q.value }));
  }
  if (store) store.addEventListener("change", () => writeState({ ...readState(), store: store.value }));
  if (min) min.addEventListener("change", () => writeState({ ...readState(), min: min.value }));
  if (sort) sort.addEventListener("change", () => writeState({ ...readState(), sort: sort.value }));
}

function render(wire = true) {
  window.__shotReady = false;
  const dealMatch = location.hash.match(/^#\/deal\/([^/?]+)/);
  if (dealMatch) {
    const found = deals.find((d) => d.id === decodeURIComponent(dealMatch[1]));
    document.title = `${found ? found.title : "Not found"} | DealHunt 2026`;
    if (!found) {
      app.innerHTML = missingPage();
    } else {
      const siblings = deals
        .filter((d) => d.category === found.category && d.id !== found.id)
        .slice(0, 3);
      app.innerHTML = dealPage(found, siblings);
    }
  } else if (/^#\/compare/.test(location.hash)) {
    document.title = "Compare prices — same product, several stores | DealHunt 2026";
    app.innerHTML = comparePage();
  } else if (/^#\/mirage/.test(location.hash)) {
    document.title = "Mirage watch — deals we refused | DealHunt 2026";
    app.innerHTML = miragePage();
  } else if (/^#\/how/.test(location.hash)) {
    document.title = "How we check | DealHunt 2026";
    app.innerHTML = howPage();
  } else {
    const state = readState();
    const shown = applyFilters(deals, state);
    document.title = "DealHunt 2026 — Black Friday deals, checked today";
    app.innerHTML = listPage(deals, shown, state, catCounts, storeCounts, stats);
    if (wire) wireToolbar(state);
    else {
      // Live search re-renders without rewiring: keep focus in the box.
      const q = document.getElementById("q");
      if (q) {
        wireToolbar(state);
        q.focus();
        q.setSelectionRange(q.value.length, q.value.length);
      }
    }
  }
  document.querySelector("footer .checked-line").textContent =
    `Prices checked Fri 27 Nov 2026, 06:30–13:30 UTC and Sat 28 Nov 2026, 01:30 UTC (08:30 WIB). Verify at the store before you buy — Black Friday prices move fast.`;
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

window.addEventListener("hashchange", () => render());
render();
