// Simulated transfer market. Prices are derived from rating + "meta" attributes and a
// deterministic random walk so charts are stable between reloads. Replace `priceHistory`
// with a real price feed to go live.

import { CARDS, cardsForGame } from './players.js';
import { CURRENT_GAME } from './meta.js';
import { rng, hash, roundPrice, clamp } from '../utils.js';

const HOURS = 30 * 24;
const RATING_PRICE = {
  75: 300, 78: 450, 80: 650, 81: 800, 82: 1000, 83: 1500, 84: 2800, 85: 5500, 86: 11000, 87: 21000,
  88: 36000, 89: 65000, 90: 115000, 91: 190000, 92: 310000, 93: 460000, 94: 680000, 95: 950000,
  96: 1350000, 97: 1900000, 98: 2700000, 99: 3800000,
};
const ratingPrice = (ovr) => {
  if (ovr < 75) return 250;
  return RATING_PRICE[ovr] ?? RATING_PRICE[Object.keys(RATING_PRICE).reverse().find((k) => k <= ovr)];
};

// How much the community values a card beyond its rating (pace, skills, weak foot, PlayStyle+).
export function metaScore(card) {
  const p = card.player;
  const [pac, sho, pas, dri, def, phy] = card.stats;
  let m;
  if (p.isGK) m = (pac + card.stats[3] * 1.5 + card.stats[5]) / 3.5;
  else if (['CB'].includes(p.pos)) m = pac * 0.35 + def * 0.4 + phy * 0.25;
  else if (['LB', 'RB', 'LWB', 'RWB'].includes(p.pos)) m = pac * 0.45 + def * 0.3 + dri * 0.25;
  else if (['CDM', 'CM'].includes(p.pos)) m = pac * 0.2 + pas * 0.3 + dri * 0.25 + def * 0.15 + phy * 0.1;
  else m = pac * 0.4 + sho * 0.25 + dri * 0.25 + pas * 0.1;
  m += (p.sm - 3) * 1.5 + (p.wf - 3) * 1.5 + p.playstyles.filter((s) => s.endsWith('+')).length;
  return clamp(Math.round(m), 1, 99);
}

const cache = new Map();

export function priceHistory(card, platform = 'console') {
  const key = card.id + platform;
  if (cache.has(key)) return cache.get(key);
  const r = rng(hash(key));
  const meta = metaScore(card);
  let target = ratingPrice(card.ovr) * clamp(1 + (meta - card.ovr) / 12, 0.45, 3);
  if (card.player.isIcon) target *= 2.4;
  if (card.type !== 'gold' && card.type !== 'icon') target *= 1.25;
  if (platform === 'pc') target *= 1.12 + r() * 0.1;
  if (card.game !== CURRENT_GAME) target *= 0.6; // archived games: final prices settle lower

  // Log-space random walk with a drift + occasional promo "crash" days.
  const drift = (r() - 0.5) * 0.0012;
  const vol = 0.006 + r() * 0.012;
  const crashAt = Math.floor(r() * HOURS);
  const walk = [0];
  for (let i = 1; i < HOURS; i++) {
    let step = drift + (r() - 0.5) * 2 * vol;
    if (Math.abs(i - crashAt) < 6) step -= 0.012;
    if (i > crashAt + 6 && i < crashAt + 40) step += 0.002;
    walk.push(walk[i - 1] + step);
  }
  const last = walk[HOURS - 1];
  const now = Math.floor(Date.now() / 3.6e6) * 3.6e6;
  const points = walk.map((w, i) => ({
    t: now - (HOURS - 1 - i) * 3.6e6,
    p: roundPrice(target * Math.exp(w - last)),
  }));
  cache.set(key, points);
  return points;
}

export function priceInfo(card, platform) {
  const h = priceHistory(card, platform);
  const cur = h[h.length - 1].p;
  const d1 = h[h.length - 25].p;
  const d7 = h[h.length - 24 * 7].p;
  const slice = h.slice(-24 * 7).map((x) => x.p);
  return {
    price: cur,
    change24: ((cur - d1) / d1) * 100,
    change7d: ((cur - d7) / d7) * 100,
    low7d: Math.min(...slice),
    high7d: Math.max(...slice),
  };
}

// A FUTBIN-style market index: mean of each top card's price relative to its 30-day average.
export function marketIndex(platform, top = 60) {
  const cards = cardsForGame(CURRENT_GAME)
    .map((c) => ({ c, h: priceHistory(c, platform) }))
    .sort((a, b) => b.h[b.h.length - 1].p - a.h[a.h.length - 1].p)
    .slice(0, top);
  const avgs = cards.map(({ h }) => h.reduce((s, x) => s + x.p, 0) / h.length);
  return cards[0].h.map((pt, i) => ({
    t: pt.t,
    p: Math.round((cards.reduce((s, { h }, k) => s + h[i].p / avgs[k], 0) / cards.length) * 1000) / 10,
  }));
}

export function movers(platform, gameId = CURRENT_GAME) {
  return cardsForGame(gameId).map((card) => ({ card, ...priceInfo(card, platform) }));
}

export { CARDS };
