// Search, filter and sort — pure functions over the deal board.
// Nothing here touches the page: main.js calls these and views.js renders
// what comes back. Keeping the logic apart from the rendering is what lets
// the same filters run on the list page and on a deal's "more like this" row.

import { verdictInfo } from "./verdict.js";

// Discount percent, rounded, or null when the store publishes no usual price.
export function percentOff(d) {
  if (!d.was || d.was <= d.price) return null;
  return Math.round((1 - d.price / d.was) * 100);
}

// Dollars (or dollars a month) saved against the usual price.
export function savings(d) {
  if (!d.was) return null;
  return Math.round((d.was - d.price) * 100) / 100;
}

function matchesQuery(d, q) {
  if (!q) return true;
  const hay = `${d.title} ${d.store} ${d.category} ${d.verdict}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => hay.includes(word));
}

// state: { q, cat, store, min, sort }
//   q: search text · cat: category or "All" · store: store or "All"
//   min: minimum discount percent (0, 25, 40 or 50) · sort: discount | saving | price | verdict
export function applyFilters(all, state) {
  const q = (state.q ?? "").trim();
  const cat = state.cat ?? "All";
  const store = state.store ?? "All";
  const min = Number(state.min ?? 0);
  const sort = state.sort ?? "discount";
  const kept = all.filter(
    (d) =>
      matchesQuery(d, q) &&
      (cat === "All" || d.category === cat) &&
      (store === "All" || d.store === store) &&
      (percentOff(d) ?? 0) >= min,
  );
  const byDiscount = (a, b) => (percentOff(b) ?? -1) - (percentOff(a) ?? -1);
  const bySaving = (a, b) => (savings(b) ?? -1) - (savings(a) ?? -1);
  const byPrice = (a, b) => a.price - b.price;
  const byVerdict = (a, b) =>
    verdictInfo(a.verdict).rank - verdictInfo(b.verdict).rank || byDiscount(a, b);
  const sorts = { discount: byDiscount, saving: bySaving, price: byPrice, verdict: byVerdict };
  return [...kept].sort(sorts[sort] ?? byDiscount);
}

// How many deals each category and each store holds (for the filter chips).
export function countBy(all, key) {
  const counts = new Map();
  for (const d of all) counts.set(d[key], (counts.get(d[key]) ?? 0) + 1);
  return counts;
}

export function totalSavings(all) {
  return all.reduce((sum, d) => sum + (savings(d) ?? 0), 0);
}

export function maxDiscount(all) {
  return Math.max(...all.map((d) => percentOff(d) ?? 0));
}

export function newLowCount(all) {
  return all.filter((d) => d.verdict === "NEW LOW").length;
}
