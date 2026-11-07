/* draw.js — the plates. Signature visual, ported unchanged from the v3 prototype.
 * Deterministic per item: a PRNG seeded on the item id keeps crust and ring wobble stable.
 * All colours come from CSS tokens, so plates follow the theme.
 */
import { daysBetween, herbRings, CRUST_CAP_DAYS } from "./model.js";

function rng(seed) {
  let h = 1779033703;
  for (const c of seed) (h = Math.imul(h ^ c.charCodeAt(0), 3432918353)), (h = (h << 13) | (h >>> 19));
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

let tokens = null; // read CSS tokens once per render, not per blob
export function readTokens() {
  const cs = getComputedStyle(document.documentElement);
  const t = (n) => cs.getPropertyValue(n).trim();
  tokens = { rim: t("--rim"), glaze: t("--glaze"), line: t("--line"), herb: t("--herb"), herb2: t("--herb2"),
    crust: t("--crust"), crust2: t("--crust2"), soil: t("--soil") };
}

function canvas(size) {
  const cv = document.createElement("canvas");
  cv.setAttribute("aria-hidden", "true");
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  cv.width = cv.height = Math.round(size * dpr);
  cv.style.width = cv.style.height = size + "px";
  const c = cv.getContext("2d");
  c.scale((dpr * size) / 150, (dpr * size) / 150); // draw in a 150×150 space
  return [cv, c];
}

export function drawDish(it, size, today) {
  if (!tokens) readTokens();
  const k = tokens, [cv, c] = canvas(size);
  c.fillStyle = k.rim; c.beginPath(); c.arc(75, 75, 74, 0, 7); c.fill();
  c.fillStyle = k.glaze; c.beginPath(); c.arc(75, 74, 71, 0, 7); c.fill();
  c.strokeStyle = k.line; c.lineWidth = 1.5; c.beginPath(); c.arc(75, 74, 50, 0, 7); c.stroke();
  if (it.done === today) {
    c.strokeStyle = k.herb; c.lineWidth = 7; c.lineCap = "round"; c.lineJoin = "round";
    c.beginPath(); c.moveTo(52, 76); c.lineTo(68, 92); c.lineTo(99, 59); c.stroke();
    return cv;
  }
  const r = rng(it.id), n = Math.min(Math.max(0, daysBetween(it.created, today)), CRUST_CAP_DAYS);
  for (let i = 0; i < n * 14; i++) {
    const a = r() * 6.283, dist = r() * (18 + n * 3.2), rad = 2.4 + r() * (3 + n * 1.2);
    c.globalAlpha = Math.min(0.78, 0.2 + n * 0.045) * (0.5 + r() * 0.5);
    c.fillStyle = r() < 0.35 ? k.crust2 : k.crust;
    c.beginPath(); c.ellipse(75 + Math.cos(a) * dist, 74 + Math.sin(a) * dist, rad, rad * (0.5 + r() * 0.6), r() * 3, 0, 7); c.fill();
  }
  c.globalAlpha = 1;
  return cv;
}

export function drawHerb(it, size, today) {
  if (!tokens) readTokens();
  const k = tokens, [cv, c] = canvas(size), r = rng(it.id);
  const rings = herbRings(it, today).slice(-30), now = (it.tended || []).includes(today);
  c.fillStyle = k.rim; c.beginPath(); c.arc(75, 75, 74, 0, 7); c.fill();
  c.fillStyle = k.soil; c.beginPath(); c.arc(75, 75, 66, 0, 7); c.fill();
  const step = Math.min(7, 58 / Math.max(rings.length, 1));
  c.fillStyle = k.herb; c.beginPath(); c.arc(75, 75, 5, 0, 7); c.fill();
  rings.forEach((on, i) => {
    const rad = 7 + (i + 1) * step, last = now && i === rings.length - 1;
    c.strokeStyle = on ? k.herb : k.herb2;
    c.lineWidth = on ? Math.max(2, step * (last ? 0.9 : 0.6)) : 1.4;
    c.beginPath();
    for (let a = 0; a <= 6.3; a += 0.15) {
      const w = 1 + (r() - 0.5) * 0.05, x = 75 + Math.cos(a) * rad * w, y = 75 + Math.sin(a) * rad * w * 0.97;
      a === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
    }
    c.closePath(); c.stroke();
  });
  return cv;
}

export const drawPlate = (it, size, today) =>
  it.kind === "dish" ? drawDish(it, size, today) : drawHerb(it, size, today);
