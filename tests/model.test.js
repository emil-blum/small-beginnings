import { describe, it, expect } from "vitest";
import * as M from "../src/model.js";

const T = "2026-11-07"; // a fixed "today"
const ago = (n) => M.addDays(T, -n);
const dish = (o = {}) => ({ id: "d1", kind: "dish", name: "Dish", who: "Me", created: T, mins: 10, done: null, ...o });
const herb = (o = {}) => ({ id: "h1", kind: "seed", name: "Herb", who: "Me", created: T, rhythm: 1, tended: [], ...o });

describe("dates", () => {
  it("counts days across a DST change", () => {
    expect(M.daysBetween("2026-10-24", "2026-10-26")).toBe(2); // EU clocks change 25 Oct
    expect(M.addDays("2026-03-28", 2)).toBe("2026-03-30");
  });
});

describe("dish effort", () => {
  it("grows ~30% per day and projects a week", () => {
    expect(M.dishMins(dish(), T)).toEqual({ age: 0, now: 10, wk: Math.round(10 * 1.3 ** 7) });
    expect(M.dishMins(dish({ created: ago(3) }), T).now).toBe(Math.round(10 * 1.3 ** 3));
  });
  it("never has negative age", () => {
    expect(M.dishMins(dish({ created: M.addDays(T, 2) }), T).age).toBe(0);
  });
  it("wash stores saved minutes; undo clears them", () => {
    const w = M.washDish(dish({ created: ago(2) }), T);
    const m = M.dishMins(dish({ created: ago(2) }), T);
    expect(w.done).toBe(T);
    expect(w.savedMins).toBe(m.wk - m.now);
    const u = M.unwashDish(w);
    expect(u.done).toBeNull();
    expect("savedMins" in u).toBe(false);
  });
});

describe("herb due / resting", () => {
  it("a never-watered herb is due from day one, for every rhythm", () => {
    for (const r of M.RHYTHMS) expect(M.herbState(herb({ rhythm: r }), T).due).toBe(true);
  });
  it.each([
    [1, 1, true], [1, 0, false],
    [2, 1, false], [2, 2, true],
    [3, 2, false], [3, 3, true],
    [7, 6, false], [7, 7, true],
  ])("rhythm %i, last watered %i days ago → due %s", (r, n, due) => {
    const h = herb({ rhythm: r, created: ago(30), tended: [ago(n)] });
    expect(M.herbState(h, T).due).toBe(due);
  });
  it("watered today is never due", () => {
    expect(M.herbState(herb({ tended: [T] }), T).due).toBe(false);
  });
});

describe("herb rings", () => {
  it("weekly: watered then 14 days untended → exactly one pale ring", () => {
    const h = herb({ rhythm: 7, created: ago(14), tended: [ago(14)] });
    // ring for the watering, then a pale ring on day 14 — but day 14 is today, which never counts.
    expect(M.herbRings(h, T)).toEqual([1]);
    expect(M.herbRings(h, M.addDays(T, 1))).toEqual([1, 0]);
    // and no second pale ring until another whole week passes (day 21)
    expect(M.herbRings(h, M.addDays(T, 7))).toEqual([1, 0]);
    expect(M.herbRings(h, M.addDays(T, 8))).toEqual([1, 0, 0]);
  });
  it("daily herb watered every day has only strong rings", () => {
    const h = herb({ created: ago(3), tended: [ago(3), ago(2), ago(1)] });
    expect(M.herbRings(h, T)).toEqual([1, 1, 1]);
  });
  it("watering removes nothing that came before", () => {
    const h = herb({ created: ago(5), tended: [ago(5)] });
    const before = M.herbRings(h, T);
    const after = M.herbRings(M.toggleWater(h, T), T);
    expect(after.slice(0, before.length)).toEqual(before);
    expect(after.at(-1)).toBe(1);
  });
});

describe("choose for me", () => {
  const items = [
    dish({ id: "d-new", created: ago(1) }),
    dish({ id: "d-old", created: ago(5) }),
    dish({ id: "d-done", created: ago(9), done: ago(1) }),
    herb({ id: "h-long", rhythm: 1, created: ago(20), tended: [ago(6)] }),
    herb({ id: "h-short", rhythm: 1, created: ago(20), tended: [ago(2)] }),
    herb({ id: "h-rest", rhythm: 7, created: ago(20), tended: [ago(1)] }),
  ];
  it("alternates oldest dish / longest-waiting due herb, skips resting and washed", () => {
    expect(M.candidates(items, [], T)).toEqual(["d-old", "h-long", "d-new", "h-short"]);
  });
  it("skips what's already on Today and fills only free slots", () => {
    const p = M.fillForMe({ day: T, ids: ["d-old"], cap: 3 }, items, T);
    // Same as the v3 prototype: alternation restarts from the remaining candidates (dish first).
    expect(p.ids).toEqual(["d-old", "d-new", "h-long"]);
  });
  it("windowsill: due first, then longest waiting", () => {
    expect(M.sillList(items, [], T).map((i) => i.id)).toEqual(["h-long", "h-short", "h-rest"]);
  });
});

describe("today plan", () => {
  const items = [dish({ id: "a" }), dish({ id: "b" })];
  it("a plan from yesterday is empty but keeps cap", () => {
    expect(M.planFor({ day: ago(1), ids: ["a"], cap: 5 }, items, T)).toEqual({ day: T, ids: [], cap: 5 });
  });
  it("drops ids of removed items", () => {
    expect(M.planFor({ day: T, ids: ["a", "gone"], cap: 3 }, items, T).ids).toEqual(["a"]);
  });
  it("cap can't go below placed count, or outside 1–6", () => {
    const p = { day: T, ids: ["a", "b"], cap: 2 };
    expect(M.stepCap(p, -1).cap).toBe(2);
    expect(M.stepCap({ ...p, ids: [], cap: 1 }, -1).cap).toBe(1);
    expect(M.stepCap({ ...p, cap: 6 }, 1).cap).toBe(6);
    expect(M.planFor({ day: T, ids: [], cap: 99 }, items, T).cap).toBe(6);
  });
});

describe("week", () => {
  it("counts the last 7 days and the top 'who'", () => {
    const items = [
      dish({ id: "x", who: "Family", done: ago(2), savedMins: 12 }),
      dish({ id: "y", who: "Family", done: ago(8), savedMins: 50 }), // outside the week
      herb({ id: "z", who: "Me", created: ago(10), tended: [ago(1), T, ago(9)] }),
    ];
    const s = M.weekStats(items, T);
    expect(s.washed).toBe(1);
    expect(s.saved).toBe(12);
    expect(s.watered).toBe(2);
    expect(s.top).toEqual({ who: "Me", share: 67 });
    expect(s.perDay.at(-1)).toEqual({ day: T, n: 1 });
  });
});

describe("restore", () => {
  let n = 0;
  const mk = () => "gen" + ++n;
  it("sanitises bad input and keeps only fields for the kind", () => {
    const out = M.parseBackup(JSON.stringify({ app: "small-beginnings", v: 3, items: [
      { id: "ok<script>", kind: "dish", name: "  Email  ", who: "Boss", created: "yesterday", mins: 9999, done: "soon", rhythm: 3, tended: ["x"] },
      { kind: "seed", name: "Walk", rhythm: 5, tended: ["2026-11-01", "nope", "2026-11-01"], mins: 4 },
      { kind: "plant", name: "x" },
      { kind: "dish", name: "" },
      null,
    ]}), T, mk);
    expect(out).toHaveLength(2);
    expect(out[0]).toEqual({ id: "okscript", kind: "dish", name: "Email", who: "Me", created: T, mins: 10, done: null });
    expect(out[1]).toEqual({ id: "gen1", kind: "seed", name: "Walk", who: "Me", created: T, rhythm: 1, tended: ["2026-11-01"] });
  });
  it("accepts a bare array and keeps valid washed dishes", () => {
    const out = M.parseBackup(JSON.stringify([{ id: "a", kind: "dish", name: "A", mins: 5, done: ago(1), savedMins: 7 }]), T, mk);
    expect(out[0]).toMatchObject({ done: ago(1), savedMins: 7, mins: 5 });
  });
  it("throws on text that isn't a backup", () => {
    expect(() => M.parseBackup("hello", T)).toThrow();
    expect(() => M.parseBackup('{"foo":1}', T)).toThrow();
  });
  it("round-trips a v4 backup and upserts by id", () => {
    const items = M.exampleItems(T, mk);
    const back = M.parseBackup(M.makeBackup(items), T, mk);
    expect(back).toEqual(items);
    const merged = M.mergeItems(items, [{ ...items[0], name: "Renamed" }]);
    expect(merged).toHaveLength(items.length);
    expect(merged[0].name).toBe("Renamed");
  });
});
