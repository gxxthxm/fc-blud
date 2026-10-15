// Simulated transfer market (the CSV has no prices). Prices come from rating + "meta"
// attributes and a deterministic random walk, so they're stable between reloads.
// Summaries are cheap and cached for every card; full hourly histories are only built for
// cards that are actually charted. Replace priceSummary/priceHistory with a real feed to go live.

import { cardsForGame } from './players.js';
import { CURRENT_GAME } from './meta.js';
import { rng, hash, roundPrice, clamp } from '../utils.js';

const HOURS = 30 * 24;
const RATING_PRICE = {
  75: 300, 78: 450, 80: 650, 81: 800, 82: 1000, 83: 1500, 84: 2800, 85: 5500, 86: 11000, 87: 21000,
  88: 36000, 89: 65000, 90: 115000, 91: 190000, 92: 310000, 93: 460000, 94: 680000, 95: 950000,
  96: 1350000, 97: 1900000, 98: 2700000, 99: 3800000,
};
function ratingPrice(ovr) {
  if (ovr < 65) return 200;
  if (ovr < 75) return 250 + (ovr - 65) * 10;
  for (let o = ovr; o >= 75; o--) if (RATING_PRICE[o]) return RATING_PRICE[o];
  return 300;
}

// How much the community values a card beyond its rating (pace, skills, weak foot, PlayStyle+).
export function metaScore(card) {
  const p = card.player;
  const [pac, sho, pas, dri, def, phy] = card.stats;
  let m;
  if (p.isGK) m = (pac + card.stats[3] * 1.5 + card.stats[5]) / 3.5;
  else if (p.pos === 'CB') m = pac * 0.35 + def * 0.4 + phy * 0.25;
  else if (['LB', 'RB', 'LWB', 'RWB'].includes(p.pos)) m = pac * 0.45 + def * 0.3 + dri * 0.25;
  else if (['CDM', 'CM'].includes(p.pos)) m = pac * 0.2 + pas * 0.3 + dri * 0.25 + def * 0.15 + phy * 0.1;
  else m = pac * 0.4 + sho * 0.25 + dri * 0.25 + pas * 0.1;
  m += (p.sm - 3) * 1.5 + (p.wf - 3) * 1.5 + p.playstyles.filter((s) => s.endsWith('+')).length;
  return clamp(Math.round(m), 1, 99);
}

const walkBuf = new Float64Array(HOURS);

// Fills walkBuf with a log-space random walk and returns the card's current target price.
function walk(card, platform) {
  const r = rng(hash(card.id + platform));
  const meta = metaScore(card);
  let target = ratingPrice(card.ovr);
  if (card.ovr >= 75) target *= clamp(1 + (meta - card.ovr) / 12, 0.45, 3);
  if (platform === 'pc') target *= 1.12 + r() * 0.1;
  if (card.game !== CURRENT_GAME) target *= 0.6; // older editions settle lower

  const vol = card.ovr >= 75 ? 0.006 + r() * 0.012 : 0.002 + r() * 0.004;
  const drift = (r() - 0.5) * 0.0012;
  const crashAt = Math.floor(r() * HOURS);
  walkBuf[0] = 0;
  for (let i = 1; i < HOURS; i++) {
    let step = drift + (r() - 0.5) * 2 * vol;
    if (Math.abs(i - crashAt) < 6) step -= 0.012;
    else if (i > crashAt + 6 && i < crashAt + 40) step += 0.002;
    walkBuf[i] = walkBuf[i - 1] + step;
  }
  return target;
}

const summaries = new Map();
export function priceInfo(card, platform) {
  const key = card.id + platform;
  let s = summaries.get(key);
  if (s) return s;
  const target = walk(card, platform);
  const last = walkBuf[HOURS - 1];
  const at = (i) => roundPrice(target * Math.exp(walkBuf[i] - last));
  let low = Infinity, high = 0;
  for (let i = HOURS - 168; i < HOURS; i++) {
    const p = at(i);
    if (p < low) low = p;
    if (p > high) high = p;
  }
  const price = at(HOURS - 1);
  const d1 = at(HOURS - 25);
  const d7 = at(HOURS - 168);
  s = { price, change24: ((price - d1) / d1) * 100, change7d: ((price - d7) / d7) * 100, low7d: low, high7d: high };
  summaries.set(key, s);
  return s;
}

const histories = new Map();
export function priceHistory(card, platform = 'console') {
  const key = card.id + platform;
  if (histories.has(key)) return histories.get(key);
  const target = walk(card, platform);
  const last = walkBuf[HOURS - 1];
  const now = Math.floor(Date.now() / 3.6e6) * 3.6e6;
  const points = Array.from(walkBuf, (w, i) => ({ t: now - (HOURS - 1 - i) * 3.6e6, p: roundPrice(target * Math.exp(w - last)) }));
  histories.set(key, points);
  if (histories.size > 400) histories.delete(histories.keys().next().value);
  return points;
}

/** The tradeable market: gold cards of an edition with their price summaries. */
export function movers(platform, gameId = CURRENT_GAME) {
  return cardsForGame(gameId).filter((c) => c.ovr >= 75).map((card) => ({ card, ...priceInfo(card, platform) }));
}

// A FUTBIN-style market index: mean of each top card's price relative to its 30-day average.
const indexCache = new Map();
export function marketIndex(platform, top = 60) {
  const key = CURRENT_GAME + platform;
  if (indexCache.has(key)) return indexCache.get(key);
  const cards = cardsForGame(CURRENT_GAME)
    .slice(0, 300) // already sorted by rating
    .sort((a, b) => priceInfo(b, platform).price - priceInfo(a, platform).price)
    .slice(0, top)
    .map((c) => priceHistory(c, platform));
  const avgs = cards.map((h) => h.reduce((s, x) => s + x.p, 0) / h.length);
  const idx = cards[0].map((pt, i) => ({
    t: pt.t,
    p: Math.round((cards.reduce((s, h, k) => s + h[i].p / avgs[k], 0) / cards.length) * 1000) / 10,
  }));
  indexCache.set(key, idx);
  return idx;
}
