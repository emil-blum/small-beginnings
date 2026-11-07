/* model.js — the rules of Small Beginnings, as plain functions.
 *
 * Nothing in here touches the page, storage or the clock. Every function that
 * depends on "today" takes it as an argument (a "YYYY-MM-DD" local date), so
 * the same rules can be tested, and later ported to Android, unchanged.
 *
 * Kinds: "dish" = one-off task in the sink. "seed" = herb on the windowsill
 * (legacy internal name, kept so old backups still load).
 */

export const GROW = 1.3;            // a dish gets ~30% harder each day it sits
export const CRUST_CAP_DAYS = 12;   // drawing stops getting crustier after this
export const WHO = ["Family", "Others", "Clients", "Me"];
export const RHYTHMS = [1, 2, 3, 7]; // every day, every other day, "twice a week" (=3), weekly
export const CAP_MIN = 1, CAP_MAX = 6, CAP_DEFAULT = 3;
export const NAME_MAX = 80, MINS_MIN = 1, MINS_MAX = 240, MINS_DEFAULT = 10;

/* ---------- dates (local calendar days) ---------- */
const DATE_RE = /^\d{4}-\d\d-\d\d$/;
export const isDateKey = (s) => typeof s === "string" && DATE_RE.test(s);

export function dkey(d) {
  const z = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate());
}
// Noon anchors avoid daylight-saving edges turning a day into 23 or 25 hours.
export const daysBetween = (a, b) =>
  Math.round((new Date(b + "T12:00") - new Date(a + "T12:00")) / 864e5);
export function addDays(k, n) {
  const d = new Date(k + "T12:00");
  d.setDate(d.getDate() + n);
  return dkey(d);
}
export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

/* ---------- today plan ---------- */
const clampCap = (n) => Math.max(CAP_MIN, Math.min(CAP_MAX, Math.round(+n) || CAP_DEFAULT));

/** The plan as it stands today: a plan from another day is empty, cap carries over. */
export function planFor(plan, items, today) {
  const cap = clampCap(plan?.cap);
  if (!plan || plan.day !== today) return { day: today, ids: [], cap };
  const live = new Set(items.map((i) => i.id));
  return { day: today, ids: (plan.ids || []).filter((id) => live.has(id)), cap };
}

/** Change room for today by delta; never below what's already placed. */
export function stepCap(plan, delta) {
  const floor = Math.max(CAP_MIN, plan.ids.length);
  return { ...plan, cap: Math.max(floor, Math.min(CAP_MAX, plan.cap + delta)) };
}

export const isDone = (it, today) =>
  it.kind === "dish" ? it.done === today : (it.tended || []).includes(today);

/* ---------- dishes ---------- */
export function dishAge(it, today) {
  return Math.max(0, daysBetween(it.created, today));
}
export function dishMins(it, today) {
  const age = dishAge(it, today);
  return {
    age,
    now: Math.round(it.mins * Math.pow(GROW, age)),
    wk: Math.round(it.mins * Math.pow(GROW, age + 7)),
  };
}
export function washDish(it, today) {
  const m = dishMins(it, today);
  return { ...it, done: today, savedMins: Math.max(0, m.wk - m.now) };
}
export function unwashDish(it) {
  const { savedMins, ...rest } = it;
  return { ...rest, done: null };
}

/* ---------- herbs ---------- */
export function herbState(it, today) {
  const r = +it.rhythm || 1;
  const t = (it.tended || []).slice().sort();
  const last = t[t.length - 1];
  // A never-watered herb counts as if its last watering was one rhythm before it was planted → due from day one.
  const since = last ? daysBetween(last, today) : daysBetween(it.created, today) + r;
  const wateredToday = t.includes(today);
  return { r, since, wateredToday, due: since >= r && !wateredToday };
}

/** Ring sequence, oldest first: 1 = watered (strong), 0 = a whole rhythm missed (pale). */
export function herbRings(it, today) {
  const r = +it.rhythm || 1;
  const t = new Set(it.tended || []);
  const out = [];
  let anchor = addDays(it.created, -r);
  const span = daysBetween(it.created, today);
  for (let i = 0; i <= span; i++) {
    const d = addDays(it.created, i);
    if (t.has(d)) { out.push(1); anchor = d; continue; }
    if (d === today) continue; // today never counts as missed
    const g = daysBetween(anchor, d);
    if (g >= 2 * r && g % r === 0) out.push(0);
  }
  return out;
}

export function toggleWater(it, today) {
  const t = it.tended || [];
  return { ...it, tended: t.includes(today) ? t.filter((d) => d !== today) : [...t, today] };
}

/* ---------- kitchen lists ---------- */
const byOldest = (a, b) => (a.created < b.created ? -1 : a.created > b.created ? 1 : 0);

/** Open dishes not on Today, oldest first. */
export function sinkList(items, onIds) {
  const on = new Set(onIds);
  return items.filter((i) => i.kind === "dish" && !i.done && !on.has(i.id)).sort(byOldest);
}

/** Herbs not on Today: due first, then the ones that have waited longest. */
export function sillList(items, onIds, today) {
  const on = new Set(onIds);
  return items
    .filter((i) => i.kind === "seed" && !on.has(i.id))
    .map((i) => [i, herbState(i, today)])
    .sort((a, b) => (b[1].due - a[1].due) || (b[1].since - a[1].since))
    .map(([i]) => i);
}

/** Choose for me: alternate oldest open dish / longest-waiting due herb. Never resting herbs. */
export function candidates(items, onIds, today) {
  const on = new Set(onIds);
  const d = sinkList(items, onIds);
  const h = items
    .filter((i) => i.kind === "seed" && !on.has(i.id) && herbState(i, today).due)
    .sort((a, b) => herbState(b, today).since - herbState(a, today).since);
  const out = [];
  let x = 0, y = 0;
  while (x < d.length || y < h.length) {
    if (x < d.length && (out.length % 2 === 0 || y >= h.length)) out.push(d[x++].id);
    else out.push(h[y++].id);
  }
  return out;
}

export function fillForMe(plan, items, today) {
  const free = plan.cap - plan.ids.length;
  if (free <= 0) return plan;
  return { ...plan, ids: [...plan.ids, ...candidates(items, plan.ids, today).slice(0, free)] };
}

/* ---------- week ---------- */
export function weekStats(items, today) {
  const days = [...Array(7)].map((_, i) => addDays(today, i - 6));
  const inWeek = new Set(days);
  const perDay = days.map((d) => ({
    day: d,
    n:
      items.filter((i) => i.kind === "dish" && i.done === d).length +
      items.filter((i) => i.kind === "seed" && (i.tended || []).includes(d)).length,
  }));
  const washed = items.filter((i) => i.kind === "dish" && inWeek.has(i.done));
  const saved = washed.reduce((s, i) => s + (i.savedMins || 0), 0);
  const waters = [];
  items
    .filter((i) => i.kind === "seed")
    .forEach((i) => (i.tended || []).forEach((d) => inWeek.has(d) && waters.push(i)));
  const tally = {};
  [...washed, ...waters].forEach((i) => (tally[i.who] = (tally[i.who] || 0) + 1));
  const total = washed.length + waters.length;
  const topEntry = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
  const top = topEntry ? { who: topEntry[0], share: Math.round((topEntry[1] / total) * 100) } : null;
  return { perDay, washed: washed.length, saved, watered: waters.length, top };
}

/* ---------- backup ---------- */
export const BACKUP_APP = "small-beginnings", BACKUP_V = 4;

export function makeBackup(items) {
  return JSON.stringify({ app: BACKUP_APP, v: BACKUP_V, items });
}

/** Clean one untrusted item. Returns null if it can't be an item. Only keeps fields for its kind. */
export function sanitizeItem(raw, today, makeId = uid) {
  if (!raw || typeof raw !== "object") return null;
  if (!["dish", "seed"].includes(raw.kind)) return null;
  const name = typeof raw.name === "string" ? raw.name.trim().slice(0, NAME_MAX) : "";
  if (!name) return null;
  const id = String(raw.id ?? "").replace(/[^\w-]/g, "").slice(0, 40) || makeId();
  const it = {
    id,
    kind: raw.kind,
    name,
    who: WHO.includes(raw.who) ? raw.who : "Me",
    created: isDateKey(raw.created) ? raw.created : today,
  };
  if (raw.example === true) it.example = true;
  if (raw.kind === "dish") {
    const m = Math.round(+raw.mins);
    it.mins = m >= MINS_MIN && m <= MINS_MAX ? m : MINS_DEFAULT;
    it.done = isDateKey(raw.done) ? raw.done : null;
    if (it.done) it.savedMins = Math.max(0, Math.round(+raw.savedMins) || 0);
  } else {
    it.rhythm = RHYTHMS.includes(+raw.rhythm) ? +raw.rhythm : 1;
    it.tended = Array.isArray(raw.tended) ? [...new Set(raw.tended.filter(isDateKey))].sort() : [];
  }
  return it;
}

/** Parse pasted backup text. Accepts {items:[...]} (v3 or v4) or a bare array. Throws if unreadable. */
export function parseBackup(text, today, makeId = uid) {
  const d = JSON.parse(text);
  const list = Array.isArray(d) ? d : d && d.items;
  if (!Array.isArray(list)) throw new Error("not a backup");
  return list.map((x) => sanitizeItem(x, today, makeId)).filter(Boolean);
}

/** Upsert restored items by id. */
export function mergeItems(items, incoming) {
  const map = new Map(items.map((i) => [i.id, i]));
  incoming.forEach((i) => map.set(i.id, i));
  return [...map.values()];
}

/* ---------- examples ---------- */
export function exampleItems(today, makeId = uid) {
  const ex = [
    { kind: "dish", name: "Answer the email you've been circling", mins: 10, who: "Clients", created: addDays(today, -3) },
    { kind: "dish", name: "Sort this week's photos of the kids", mins: 15, who: "Family", created: addDays(today, -1) },
    { kind: "dish", name: "Write down one idea before it fades", mins: 5, who: "Me", created: today },
    { kind: "seed", name: "Standing practice", rhythm: 1, who: "Me", created: addDays(today, -14),
      tended: [...Array(14)].map((_, i) => addDays(today, -i - 1)).filter((_, i) => i % 5 !== 3) },
    { kind: "seed", name: "A few lines to each child", rhythm: 3, who: "Family", created: addDays(today, -10),
      tended: [addDays(today, -10), addDays(today, -7), addDays(today, -4)] },
  ];
  return ex.map((e) => sanitizeItem({ ...e, id: makeId(), example: true }, today, makeId));
}
