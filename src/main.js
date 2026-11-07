/* main.js — the page: rendering, sheets, navigation, backup.
 * The rules live in model.js, the words in strings.js, the saving in storage.js,
 * the plates in draw.js. This file wires them together.
 */
import "@fontsource/shippori-mincho/latin-700.css";
import "@fontsource/albert-sans/latin-400.css";
import "@fontsource/albert-sans/latin-500.css";
import "@fontsource/albert-sans/latin-600.css";
import "@fontsource/albert-sans/latin-ext-400.css";
import "@fontsource/albert-sans/latin-ext-600.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "./styles.css";

import { createIcons, Sun, CookingPot, CalendarRange, Plus, Minus, X, Trash, Sparkles, Droplet,
  Check, Undo2, Heart, Users, Briefcase, User, Copy, Upload, Download, Share2, ClipboardPaste, Settings,
  Monitor, Moon } from "lucide";
import { registerSW } from "virtual:pwa-register";
import * as M from "./model.js";
import { S } from "./strings.js";
import { store, askPersist } from "./storage.js";
import { drawPlate, readTokens } from "./draw.js";

const ICONS = { Sun, CookingPot, CalendarRange, Plus, Minus, X, Trash, Sparkles, Droplet, Check, Undo2, Heart, Users,
  Briefcase, User, Copy, Upload, Download, Share2, ClipboardPaste, Settings, Monitor, Moon };
const WHO_ORDER = ["Me", "Family", "Others", "Clients"]; // display order in Week
const WHO_ICON = { Family: "heart", Others: "users", Clients: "briefcase", Me: "user" };
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const icons = () => createIcons({ icons: ICONS });

/* ---------- state ---------- */
let TODAY = M.dkey(new Date());
let items = [];
let rawPlan = null;
const plan = () => M.planFor(rawPlan, items, TODAY);

async function putItem(it) { items = upsert(items, it); render(); await store.putItem(it); }
async function delItem(id) { items = items.filter((x) => x.id !== id); render(); await store.deleteItem(id); }
async function putPlan(p) { rawPlan = p; render(); await store.putPlan(p); }
const upsert = (list, it) => { const i = list.findIndex((x) => x.id === it.id); return i < 0 ? [...list, it] : list.map((x, j) => (j === i ? it : x)); };

/* ---------- static text from strings.js ---------- */
document.querySelectorAll("[data-s]").forEach((el) => (el.textContent = S[el.dataset.s]));
document.querySelectorAll("[data-s-label]").forEach((el) => el.setAttribute("aria-label", S[el.dataset.sLabel]));
$("fRhythm").innerHTML = M.RHYTHMS.map((r) => `<button type="button" data-r="${r}" aria-pressed="${r === 1}">${S.rhythmPick[r]}</button>`).join("");
$("fWho").innerHTML = M.WHO.map((w, i) => `<button type="button" data-w="${w}" aria-pressed="${i === 0}"><i data-lucide="${WHO_ICON[w]}"></i>${S.who[w]}</button>`).join("");

/* ---------- date rollover (fixes the v3 "today frozen at load" bug) ---------- */
function checkDay() {
  const k = M.dkey(new Date());
  if (k !== TODAY) { TODAY = k; render(); }
}
function scheduleMidnight() {
  const n = new Date(), next = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, 0, 0, 2);
  setTimeout(() => { checkDay(); scheduleMidnight(); }, next - n);
}
document.addEventListener("visibilitychange", () => { if (!document.hidden) checkDay(); });
addEventListener("focus", checkDay);
addEventListener("pageshow", checkDay);
setInterval(checkDay, 60_000); // timers sleep while the phone does; this catches any drift
scheduleMidnight();

/* ---------- pieces ---------- */
function btn(html, cls, fn, attrs = {}) {
  const b = document.createElement("button");
  b.type = "button"; b.className = cls; b.innerHTML = html; b.onclick = fn;
  for (const k in attrs) b.setAttribute(k, attrs[k]);
  return b;
}

function facts(it) {
  let state = "";
  if (it.kind === "dish") {
    const m = M.dishMins(it, TODAY);
    state = it.done === TODAY ? `<span class="state due">${S.washedSaved(it.savedMins || 0)}</span>`
      : m.age === 0 ? `<span class="meta">${S.minsNow(m.now, m.wk)}</span>`
      : `<span class="state left">${S.inSink(m.age, m.now)}</span>`;
  } else {
    const s = M.herbState(it, TODAY), n = (it.tended || []).length;
    state = `<span class="meta">${S.rings(n)} · ${S.rhythm[s.r]}</span>` +
      (s.wateredToday ? `<span class="state due">${S.wateredToday}</span>`
        : s.due ? `<span class="state due">${S.due}</span>` : `<span class="state rest">${S.resting}</span>`);
  }
  return `<div class="facts">${state}</div><div class="facts"><span class="who"><i data-lucide="${WHO_ICON[it.who] || "user"}"></i>${esc(S.forWho(it.who))}</span>${it.example ? `<span class="ex">${S.example}</span>` : ""}</div>`;
}

function rowShell(it, size, extra) {
  const el = document.createElement("article");
  el.className = "row" + (extra ? " " + extra : "");
  el.appendChild(drawPlate(it, size, TODAY));
  const b = document.createElement("div");
  b.className = "body";
  b.innerHTML = `<h3 class="h">${esc(it.name)}</h3>${facts(it)}`;
  el.appendChild(b);
  return [el, b];
}

/* ---------- render ---------- */
function render() {
  readTokens();
  $("date").textContent = new Date(TODAY + "T12:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const tp = plan(), full = tp.ids.length >= tp.cap;

  // TODAY
  $("capn").textContent = tp.cap;
  $("minus").disabled = tp.cap <= M.CAP_MIN || tp.cap <= tp.ids.length;
  $("plus").disabled = tp.cap >= M.CAP_MAX;
  const L = $("todayList");
  L.replaceChildren();
  tp.ids.forEach((id) => {
    const it = items.find((i) => i.id === id);
    if (!it) return;
    const [el, b] = rowShell(it, 84);
    const a = document.createElement("div");
    a.className = "actions";
    if (it.kind === "dish") {
      if (it.done === TODAY) a.appendChild(btn(`<i data-lucide="undo-2"></i>${S.undo}`, "btn text", () => putItem(M.unwashDish(it))));
      else a.appendChild(btn(`<i data-lucide="sparkles"></i>${S.wash}`, "btn primary", () => putItem(M.washDish(it, TODAY))));
    } else {
      const w = (it.tended || []).includes(TODAY);
      a.appendChild(btn(w ? `<i data-lucide="check"></i>${S.watered}` : `<i data-lucide="droplet"></i>${S.water}`,
        w ? "btn done" : "btn primary", () => putItem(M.toggleWater(it, TODAY))));
    }
    if (!M.isDone(it, TODAY)) a.appendChild(btn(S.putBack, "btn text", () => putPlan({ ...tp, ids: tp.ids.filter((x) => x !== id) })));
    b.appendChild(a);
    L.appendChild(el);
  });
  const anyCandidates = M.candidates(items, tp.ids, TODAY).length > 0;
  for (let i = tp.ids.length; i < tp.cap; i++) {
    const s = document.createElement("div");
    s.className = "slot";
    s.innerHTML = `<div class="o"></div><div class="body"><div class="h" style="color:var(--muted)">${S.openSpace}</div></div>`;
    const a = document.createElement("div");
    a.className = "actions";
    a.appendChild(btn(`<i data-lucide="plus"></i>${S.addFromKitchen}`, "btn quiet", () => go("kitchen")));
    if (i === tp.ids.length && anyCandidates) a.appendChild(btn(`<i data-lucide="sparkles"></i>${S.chooseForMe}`, "btn text", () => putPlan(M.fillForMe(plan(), items, TODAY))));
    s.querySelector(".body").appendChild(a);
    L.appendChild(s);
  }
  const placed = tp.ids.map((id) => items.find((i) => i.id === id)).filter(Boolean);
  const dn = placed.filter((i) => M.isDone(i, TODAY)).length;
  $("todayNote").textContent = !items.length ? S.noteEmptyKitchen
    : !placed.length ? S.noteNothingPicked
    : dn === placed.length && full ? S.noteAllDoneFull
    : dn === placed.length ? S.noteAllDoneRoom
    : S.noteSome(dn, placed.length);

  // KITCHEN
  const sink = M.sinkList(items, tp.ids), sill = M.sillList(items, tp.ids, TODAY);
  $("sinkN").textContent = sink.length ? "· " + sink.length : "";
  $("sillN").textContent = sill.length ? "· " + sill.length : "";
  const fill = (host, list, emptyTxt) => {
    host.replaceChildren();
    if (!list.length) {
      const p = document.createElement("p");
      p.className = "empty"; p.textContent = emptyTxt;
      host.appendChild(p);
      return;
    }
    list.forEach((it) => {
      const [el] = rowShell(it, 64, "kitchenrow");
      const side = document.createElement("div");
      side.className = "side";
      side.appendChild(btn('<i data-lucide="sun"></i>', "icon solid", () => putPlan({ ...plan(), ids: [...plan().ids, it.id] }),
        full ? { "aria-label": S.todayFull, disabled: "" } : { "aria-label": S.addToToday, title: S.addToToday }));
      side.appendChild(btn('<i data-lucide="trash"></i>', "icon", () => askRemove(it), { "aria-label": S.remove, title: S.remove }));
      el.appendChild(side);
      host.appendChild(el);
    });
  };
  const anyDish = items.some((i) => i.kind === "dish"), anyHerb = items.some((i) => i.kind === "seed");
  fill($("sink"), sink, anyDish ? S.sinkClear : S.sinkEmpty);
  fill($("sill"), sill, anyHerb ? S.sillAllOnToday : S.sillEmpty);

  week();
  settingsInfo();
  icons();
}

function week() {
  const w = M.weekStats(items, TODAY);
  $("days").innerHTML = w.perDay.map(({ day, n }) => {
    const wd = new Date(day + "T12:00").toLocaleDateString("en-GB", { weekday: "narrow" });
    return `<div class="day${day === TODAY ? " today" : ""}"><span class="eyebrow">${wd}</span><span class="dot${n ? " on" : ""}">${n || ""}</span></div>`;
  }).join("");
  $("stats").innerHTML = `
    <div class="stat"><span class="eyebrow">${S.statWashed}</span><b>${w.washed}</b><span class="meta">${S.statSaved(w.saved)}</span></div>
    <div class="stat"><span class="eyebrow">${S.statWatered}</span><b>${w.watered}</b><span class="meta">${S.statWateredLine}</span></div>`;
  const cell = (n) => `<span class="n${n ? "" : " zero"}">${n}</span>`;
  $("whoCard").innerHTML = `<div class="stat"><span class="eyebrow">${S.statHelped}</span><b class="word">${w.top ? esc(S.who[w.top.who]) : "—"}</b><span class="meta">${w.top ? S.statHelpedLine(w.top.share) : S.statHelpedNone}</span></div>
    <div class="whotable"><span></span><span class="eyebrow">${S.whoWeek}</span><span class="eyebrow">${S.whoAll}</span>
    ${WHO_ORDER.map((k) => `<span class="lbl"><i data-lucide="${WHO_ICON[k]}"></i>${S.who[k]}</span>${cell(w.byWho[k].week)}${cell(w.byWho[k].all)}`).join("")}</div>`;
}

/* ---------- navigation ---------- */
const VIEWS = ["today", "kitchen", "week"];
const fromHash = () => (VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : "today");
function go(v) {
  if (!VIEWS.includes(v)) v = "today";
  if (location.hash !== "#" + v) history.replaceState(null, "", "#" + v);
  show(v);
}
function show(v) {
  VIEWS.forEach((n) => {
    $("v-" + n).hidden = n !== v;
    const b = document.querySelector(`[data-view="${n}"]`);
    if (n === v) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
  });
  window.scrollTo(0, 0);
}
document.querySelectorAll("[data-view]").forEach((b) => (b.onclick = () => go(b.dataset.view)));
addEventListener("hashchange", () => show(fromHash()));
show(fromHash());

/* ---------- sheets (add, remove, settings, notice) ---------- */
// One stack so Esc closes the topmost sheet and focus returns where it came from.
const openStack = [];
function openSheet(id) {
  if (!$(id).hidden) return;
  openStack.push({ id, from: document.activeElement });
  $(id).hidden = false;
  document.body.classList.add("locked"); // the page behind doesn't scroll
}
function closeSheet(id) {
  if ($(id).hidden) return;
  $(id).hidden = true;
  const i = openStack.findIndex((x) => x.id === id);
  const [entry] = i < 0 ? [] : openStack.splice(i, 1);
  if (id === "cfScrim") pending = null;
  if (!openStack.length) document.body.classList.remove("locked");
  entry?.from?.focus?.();
  maybeReload();
}
document.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => closeSheet(b.dataset.close)));
document.querySelectorAll(".scrim").forEach((sc) => sc.addEventListener("click", (e) => { if (e.target === sc) closeSheet(sc.id); }));
addEventListener("keydown", (e) => { if (e.key === "Escape" && openStack.length) closeSheet(openStack.at(-1).id); });

function notice(title, text) {
  $("ntTitle").textContent = title;
  $("ntText").textContent = text;
  openSheet("ntScrim");
  $("ntClose").focus();
}

/* ---------- room for today ---------- */
$("minus").onclick = () => putPlan(M.stepCap(plan(), -1));
$("plus").onclick = () => putPlan(M.stepCap(plan(), 1));

/* ---------- add sheet ---------- */
let kind = "dish", rhythm = 1, who = "Family";
const pick = (groupId, attr, val) =>
  document.querySelectorAll(`#${groupId} button`).forEach((b) => b.setAttribute("aria-pressed", b.dataset[attr] == String(val)));
function setKind(k) {
  kind = k;
  $("kDish").setAttribute("aria-pressed", k === "dish");
  $("kSeed").setAttribute("aria-pressed", k === "seed");
  $("fMinsF").hidden = k !== "dish";
  $("fRhythmF").hidden = k !== "seed";
  $("addTitle").textContent = k === "dish" ? S.addDish : S.addHerb;
  $("addSubmit").textContent = k === "dish" ? S.submitDish : S.submitHerb;
  $("fName").placeholder = k === "dish" ? S.placeholderDish : S.placeholderHerb;
  $("kindHint").textContent = k === "dish" ? S.hintDish : S.hintHerb;
}
function openAdd(k) { setKind(k); openSheet("addScrim"); setTimeout(() => $("fName").focus(), 50); }
document.querySelectorAll("[data-add]").forEach((b) => (b.onclick = () => openAdd(b.dataset.add)));
$("kDish").onclick = () => setKind("dish");
$("kSeed").onclick = () => setKind("seed");
document.querySelectorAll("#fRhythm button").forEach((b) => (b.onclick = () => { rhythm = +b.dataset.r; pick("fRhythm", "r", rhythm); }));
document.querySelectorAll("#fWho button").forEach((b) => (b.onclick = () => { who = b.dataset.w; pick("fWho", "w", who); }));
$("addForm").addEventListener("submit", (e) => {
  e.preventDefault();
  checkDay();
  const it = M.sanitizeItem({ id: M.uid(), kind, name: $("fName").value, who, created: TODAY,
    mins: parseInt($("fMins").value, 10), rhythm }, TODAY);
  if (!it) return;
  putItem(it);
  $("fName").value = "";
  closeSheet("addScrim");
});

/* ---------- confirm remove ---------- */
let pending = null;
function askRemove(it) {
  const n = (it.tended || []).length;
  $("cfTitle").textContent = S.removeTitle(it.name);
  $("cfText").textContent = it.kind === "seed" && n ? S.removeRings(n) : S.removePlain;
  openSheet("cfScrim");
  pending = it;
  $("cfNo").focus();
}
$("cfYes").onclick = () => { const it = pending; closeSheet("cfScrim"); if (it) delItem(it.id); };

/* ---------- settings: appearance ---------- */
const THEME_KEY = "sb-theme";
const THEME_COLOR = { light: "#E6ECE5", dark: "#111714" };
const getTheme = () => { try { return localStorage.getItem(THEME_KEY) || "system"; } catch { return "system"; } };
function applyTheme(t) {
  const root = document.documentElement;
  if (t === "light" || t === "dark") root.dataset.theme = t; else delete root.dataset.theme;
  // the phone's status bar colour follows the chosen theme too
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    const media = m.getAttribute("media") || "";
    m.content = t === "system" ? THEME_COLOR[media.includes("dark") ? "dark" : "light"] : THEME_COLOR[t];
  });
  pick("fTheme", "t", t);
}
document.querySelectorAll("#fTheme button").forEach((b) => (b.onclick = () => {
  const t = b.dataset.t;
  try { t === "system" ? localStorage.removeItem(THEME_KEY) : localStorage.setItem(THEME_KEY, t); } catch {}
  applyTheme(t);
}));
applyTheme(getTheme());
$("openSettings").onclick = () => {
  settingsInfo();
  // open fresh each time: paste box closed, scrolled to the top
  $("restoreBox").hidden = true;
  $("showRestore").setAttribute("aria-expanded", "false");
  openSheet("setScrim");
  $("setScrim").querySelector(".sheet").scrollTop = 0;
};

/* ---------- settings: backup ---------- */
const backupName = () => `small-beginnings-backup-${TODAY}.json`;
async function markBackedUp() { await store.putMeta({ lastBackup: TODAY }); settingsInfo(); }
function settingsInfo() {
  const lb = store.getMeta().lastBackup;
  $("lastBk").textContent = S.lastBackup(M.isDateKey(lb) ? Math.max(0, M.daysBetween(lb, TODAY)) : null);
  $("version").textContent = S.version(__APP_VERSION__, __BUILD_DATE__);
}

$("saveBk").onclick = () => {
  const url = URL.createObjectURL(new Blob([M.makeBackup(items)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url; a.download = backupName();
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  markBackedUp();
};

// "Send to…" opens the phone's share sheet (Drive, email, messages). Only shown where it works.
const backupFile = () => new File([M.makeBackup(items)], backupName(), { type: "application/json" });
try { $("shareBk").hidden = !navigator.canShare?.({ files: [backupFile()] }); } catch { $("shareBk").hidden = true; }
$("shareBk").onclick = async () => {
  try { await navigator.share({ files: [backupFile()], title: "Small Beginnings backup" }); markBackedUp(); }
  catch { /* cancelled */ }
};

$("copyBk").onclick = () => {
  const txt = M.makeBackup(items);
  const fallback = () => { const f = $("bkFallback"); f.hidden = false; f.value = txt; f.select(); markBackedUp(); };
  const done = () => { $("copyBk").innerHTML = `<i data-lucide="check"></i>${S.copied}`; icons(); markBackedUp(); };
  try { navigator.clipboard.writeText(txt).then(done, fallback); } catch { fallback(); }
};

/* ---------- settings: restore ---------- */
async function restoreFrom(text) {
  let incoming;
  try { incoming = M.parseBackup(text, TODAY); } catch { return notice(S.restoreBadTitle, S.restoreBad); }
  if (!incoming.length) return notice(S.restoreEmptyTitle, S.restoreEmpty);
  items = M.mergeItems(items, incoming);
  render();
  await store.putItems(items);
  $("restoreTxt").value = "";
  $("restoreBox").hidden = true;
  $("showRestore").setAttribute("aria-expanded", "false");
  notice(S.restoredTitle, S.restored(incoming.length));
}
$("restoreFileBtn").onclick = () => $("restoreFile").click();
$("restoreFile").onchange = async (e) => {
  const f = e.target.files?.[0];
  e.target.value = "";
  if (f) restoreFrom(await f.text());
};
$("showRestore").onclick = () => {
  const box = $("restoreBox");
  box.hidden = !box.hidden;
  $("showRestore").setAttribute("aria-expanded", String(!box.hidden));
  if (!box.hidden) $("restoreTxt").focus();
};
$("doRestore").onclick = () => restoreFrom($("restoreTxt").value);

/* ---------- theme changes redraw the plates ---------- */
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", render);
new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

/* ---------- updates ---------- */
// A new version downloads in the background. It's applied by reloading, but never while
// a sheet is open (you might be typing): it waits until sheets close or the app is hidden.
let reloadPending = false;
function maybeReload() { if (reloadPending && !openStack.length) location.reload(); }
registerSW({
  immediate: true,
  onNeedReload() { reloadPending = true; maybeReload(); },
  onRegisteredSW(_url, reg) {
    if (!reg) return;
    // Installed apps can stay open for days: look for a new version whenever it comes back to the front.
    document.addEventListener("visibilitychange", () => { if (!document.hidden) reg.update().catch(() => {}); });
  },
});
document.addEventListener("visibilitychange", () => { if (document.hidden && reloadPending) location.reload(); });

/* ---------- boot ---------- */
(async function boot() {
  render(); // empty shell straight away
  const { items: saved, plan: p, meta, ok } = await store.loadAll();
  items = saved;
  rawPlan = p;
  // First install: one example dish and herb. Only ever once, and never into a kitchen that has things in it.
  if (!meta.seeded) {
    if (!items.length) {
      items = M.starterItems(TODAY, { dish: S.starterDish, herb: S.starterHerb });
      await store.putItems(items);
    }
    await store.putMeta({ seeded: true });
  }
  render();
  const persisted = ok && (await askPersist());
  $("status").textContent = !ok ? S.savedNowhere : persisted ? S.savedDevice : S.savedDeviceSoft;
})();
