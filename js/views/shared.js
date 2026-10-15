// Bits shared across views: price/change cells, player picker, demo-data notice.

import { esc, fmtCoins, fmtPct, debounce } from '../utils.js';
import { cardsForGame, normalize } from '../data/players.js';
import { renderMini, avatar } from '../components/card.js';

export const changeBadge = (pct) =>
  `<span class="chg ${pct > 0.05 ? 'up' : pct < -0.05 ? 'down' : 'flat'}">${pct > 0.05 ? '▲' : pct < -0.05 ? '▼' : '•'} ${fmtPct(Math.abs(pct) < 0.05 ? 0 : pct)}</span>`;

export const coins = (n) => `<span class="coins"><i class="coin" aria-hidden="true"></i>${fmtCoins(n)}</span>`;

export const demoNote = (what) =>
  `<div class="demo-note"><b>Demo data</b> ${esc(what)}</div>`;

export function searchCards(gameId, q, limit = 8) {
  const s = normalize(q.trim());
  if (!s) return [];
  const out = [];
  for (const c of cardsForGame(gameId)) { // sorted by rating, so the first hits are the best
    if (c.player.search.includes(s)) out.push(c);
    if (out.length >= limit) break;
  }
  return out;
}

/** Attaches a type-ahead to `input`; calls onPick(card) when a result is chosen. */
export function attachPicker(input, gameId, onPick, { limit = 8 } = {}) {
  const box = document.createElement('div');
  box.className = 'picker';
  box.hidden = true;
  input.parentElement.style.position = 'relative';
  input.parentElement.appendChild(box);
  let results = [];
  let sel = -1;
  const draw = () => {
    box.hidden = !results.length;
    box.innerHTML = results.map((c, i) => `
      <button type="button" class="pick ${i === sel ? 'sel' : ''}" data-i="${i}">
        ${renderMini(c)}<span class="pick-name">${avatar(c)}${esc(c.player.name)}</span>
        <span class="muted small">${c.player.pos} · ${esc(c.club)}</span>
      </button>`).join('');
  };
  input.addEventListener('input', debounce(() => { results = searchCards(gameId(), input.value, limit); sel = -1; draw(); }, 120));
  input.addEventListener('keydown', (e) => {
    if (box.hidden) return;
    if (e.key === 'ArrowDown') { sel = Math.min(results.length - 1, sel + 1); draw(); e.preventDefault(); }
    if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); draw(); e.preventDefault(); }
    if (e.key === 'Enter' && sel >= 0) { e.preventDefault(); e.stopPropagation(); choose(sel); }
    if (e.key === 'Escape') { results = []; draw(); }
  });
  const choose = (i) => { const c = results[i]; results = []; draw(); input.value = ''; onPick(c); };
  box.addEventListener('mousedown', (e) => {
    const b = e.target.closest('[data-i]');
    if (b) { e.preventDefault(); choose(+b.dataset.i); }
  });
  input.addEventListener('blur', () => setTimeout(() => { box.hidden = true; }, 120));
  input.addEventListener('focus', () => { if (results.length) box.hidden = false; });
}
