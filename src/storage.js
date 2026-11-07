/* storage.js — where the kitchen is kept: IndexedDB on this device (via idb-keyval).
 *
 * Small on purpose: the app keeps everything in memory and writes through.
 * If the app later moves to Capacitor/native, only this file changes.
 * Keys: "items" (array of items), "plan" (today's plan), "meta" ({ lastBackup }).
 */
import { createStore, get, set } from "idb-keyval";

let db = null;
try { db = createStore("small-beginnings", "kv"); } catch { db = null; }

let mem = { items: [], plan: null, meta: {} };
let ok = !!db;

export const store = {
  /** Load everything. Resolves to { items, plan, ok } — ok=false means nothing will persist. */
  async loadAll() {
    if (db) {
      try {
        const [items, plan, meta] = await Promise.all([get("items", db), get("plan", db), get("meta", db)]);
        mem = { items: Array.isArray(items) ? items : [], plan: plan || null, meta: meta || {} };
      } catch { ok = false; }
    }
    return { ...mem, ok };
  },
  async putItem(item) {
    const i = mem.items.findIndex((x) => x.id === item.id);
    mem.items = i < 0 ? [...mem.items, item] : mem.items.map((x, j) => (j === i ? item : x));
    return writeItems();
  },
  async putItems(items) { mem.items = items; return writeItems(); },
  async deleteItem(id) { mem.items = mem.items.filter((x) => x.id !== id); return writeItems(); },
  getItems: () => mem.items,
  getPlan: () => mem.plan,
  async putPlan(plan) {
    mem.plan = plan;
    if (ok) try { await set("plan", plan, db); } catch { ok = false; }
  },
  getMeta: () => mem.meta,
  async putMeta(patch) {
    mem.meta = { ...mem.meta, ...patch };
    if (ok) try { await set("meta", mem.meta, db); } catch { ok = false; }
  },
  isOk: () => ok,
};

async function writeItems() {
  if (ok) try { await set("items", mem.items, db); } catch { ok = false; }
}

/** Ask the browser not to evict our data. Resolves true if granted. */
export async function askPersist() {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch { return false; }
}
