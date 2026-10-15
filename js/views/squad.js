import { esc, fmtCoins } from '../utils.js';
import { state, setState } from '../state.js';
import { gameById, CARD_TYPES } from '../data/meta.js';
import { cardById, cardsForGame } from '../data/players.js';
import { priceInfo } from '../data/market.js';
import { renderCard, renderMini, cardHref } from '../components/card.js';
import { attachPicker, coins } from './shared.js';

// [position, x%, y%] — y grows toward our own goal.
const FORMATIONS = {
  '4-3-3': [['ST', 50, 12], ['LW', 17, 20], ['RW', 83, 20], ['CM', 28, 46], ['CM', 50, 52], ['CM', 72, 46], ['LB', 12, 72], ['CB', 36, 77], ['CB', 64, 77], ['RB', 88, 72], ['GK', 50, 93]],
  '4-4-2': [['ST', 37, 13], ['ST', 63, 13], ['LM', 12, 42], ['CM', 37, 50], ['CM', 63, 50], ['RM', 88, 42], ['LB', 12, 72], ['CB', 36, 77], ['CB', 64, 77], ['RB', 88, 72], ['GK', 50, 93]],
  '4-2-3-1': [['ST', 50, 11], ['LM', 16, 31], ['CAM', 50, 31], ['RM', 84, 31], ['CDM', 36, 54], ['CDM', 64, 54], ['LB', 12, 72], ['CB', 36, 77], ['CB', 64, 77], ['RB', 88, 72], ['GK', 50, 93]],
  '3-5-2': [['ST', 37, 13], ['ST', 63, 13], ['LM', 10, 42], ['CM', 32, 52], ['CAM', 50, 34], ['CM', 68, 52], ['RM', 90, 42], ['CB', 26, 76], ['CB', 50, 79], ['CB', 74, 76], ['GK', 50, 93]],
};

const inPosition = (card, pos) => card.player.pos === pos || card.player.altPos.includes(pos);
const tier = (n, steps) => steps.filter((s) => n >= s).length;

/** FUT chemistry (FIFA 23+ model): 0–3 per in-position player from club, league and nation links. */
export function chemistry(placed) {
  const active = placed.filter(({ card, pos }) => card && inPosition(card, pos));
  const count = (key, weight = () => 1) => active.reduce((m, { card }) => {
    const k = key(card);
    if (k) m[k] = (m[k] || 0) + weight(card);
    return m;
  }, {});
  const clubs = count((c) => (c.player.isIcon ? null : c.club));
  const leagues = count((c) => (c.player.isIcon ? null : c.league));
  const nations = count((c) => c.player.nation, (c) => (c.player.isIcon ? 2 : 1));
  return placed.map(({ card, pos }) => {
    if (!card || !inPosition(card, pos)) return 0;
    if (card.player.isIcon) return 3;
    return Math.min(3, tier(clubs[card.club], [2, 5, 8]) + tier(leagues[card.league], [3, 5, 8]) + tier(nations[card.player.nation], [2, 5, 8]));
  });
}

export function teamRating(cards) {
  if (!cards.length) return 0;
  const ovrs = cards.map((c) => c.ovr);
  const sum = ovrs.reduce((s, x) => s + x, 0);
  const avg = sum / 11;
  const correction = ovrs.reduce((s, x) => s + Math.max(0, x - avg), 0);
  return Math.min(99, Math.floor((sum + correction) / 11));
}

export function render(root, { query }) {
  const game = gameById(state.game);
  const squads = { ...state.squad };
  const squad = squads[game.id] || { formation: '4-3-3', slots: {} };
  const save = () => setState({ squad: { ...squads, [game.id]: squad } }, { silent: true });

  if (query.add) {
    const c = cardById(query.add);
    if (c && c.game === game.id) {
      const f = FORMATIONS[squad.formation];
      const free = f.map((_, i) => i).filter((i) => !squad.slots[i]);
      const idx = free.find((i) => inPosition(c, f[i][0])) ?? free[0];
      if (idx != null && !Object.values(squad.slots).some((id) => cardById(id)?.player.id === c.player.id)) {
        squad.slots[idx] = c.id;
        save();
      }
    }
    history.replaceState(null, '', '#/squad');
  }

  const draw = () => {
    const f = FORMATIONS[squad.formation];
    const placed = f.map(([pos], i) => ({ pos, card: cardById(squad.slots[i]) }));
    const chem = chemistry(placed);
    const cards = placed.map((p) => p.card).filter(Boolean);
    const total = cards.reduce((s, c) => s + priceInfo(c, state.platform).price, 0);
    const chemTotal = chem.reduce((s, x) => s + x, 0);

    root.innerHTML = `
    <div class="page-head">
      <div><h1>Squad builder</h1><p class="muted">${esc(game.short)} · FUT chemistry &amp; team rating</p></div>
      <div class="squad-controls">
        <select id="formation" aria-label="Formation">${Object.keys(FORMATIONS).map((k) => `<option ${k === squad.formation ? 'selected' : ''}>${k}</option>`).join('')}</select>
        <button class="btn ghost" id="clear">Clear</button>
        <button class="btn" id="auto">Auto-fill best XI</button>
      </div>
    </div>
    <div class="squad-layout">
      <div class="pitch">
        <div class="pitch-lines"></div>
        ${f.map(([pos, x, y], i) => {
          const c = placed[i].card;
          return `<button class="slot" style="left:${x}%;top:${y}%" data-slot="${i}" aria-label="${pos} slot">
            ${c ? renderCard(c, { size: 'xs', link: false }) : `<span class="slot-empty">＋</span>`}
            <span class="slot-pos ${c && !inPosition(c, pos) ? 'oop' : ''}">${pos}${c ? ` · <i class="chem c${chem[i]}">${'◆'.repeat(chem[i])}${'◇'.repeat(3 - chem[i])}</i>` : ''}</span>
          </button>`;
        }).join('')}
      </div>
      <aside class="panel squad-stats">
        <div class="stat-tile"><span>Team rating</span><b>${cards.length ? teamRating(cards) : '—'}</b></div>
        <div class="stat-tile"><span>Chemistry</span><b>${chemTotal}<small>/33</small></b><div class="bar"><i style="width:${(chemTotal / 33) * 100}%"></i></div></div>
        <div class="stat-tile"><span>Squad value</span><b>${coins(total)}</b></div>
        <p class="muted small">Chemistry: club links at 2/5/8 players, league at 3/5/8, nation at 2/5/8. Icons always get full chem and count double for their nation. Out-of-position players get 0.</p>
        <h4>Players (${cards.length}/11)</h4>
        <ul class="squad-list">${placed.map(({ card, pos }, i) => card ? `
          <li>${renderMini(card)}<a href="${cardHref(card)}">${esc(card.player.name)}</a><span class="muted small">${pos}</span><span class="chem c${chem[i]}">${chem[i]}</span></li>` : '').join('')}</ul>
      </aside>
    </div>`;

    root.querySelector('#formation').addEventListener('change', (e) => { squad.formation = e.target.value; save(); draw(); });
    root.querySelector('#clear').addEventListener('click', () => { squad.slots = {}; save(); draw(); });
    root.querySelector('#auto').addEventListener('click', () => { autoFill(); save(); draw(); });
    root.querySelectorAll('[data-slot]').forEach((b) => b.addEventListener('click', () => openSlot(+b.dataset.slot)));
  };

  const autoFill = () => {
    const f = FORMATIONS[squad.formation];
    const used = new Set();
    const pool = cardsForGame(game.id).sort((a, b) => b.ovr - a.ovr);
    squad.slots = {};
    f.forEach(([pos], i) => {
      const c = pool.find((x) => !used.has(x.player.id) && inPosition(x, pos));
      if (c) { squad.slots[i] = c.id; used.add(c.player.id); }
    });
  };

  const openSlot = (i) => {
    const [pos] = FORMATIONS[squad.formation][i];
    const current = cardById(squad.slots[i]);
    const taken = new Set(Object.entries(squad.slots).filter(([k]) => +k !== i).map(([, id]) => cardById(id)?.player.id));
    const suggestions = cardsForGame(game.id)
      .filter((c) => inPosition(c, pos) && !taken.has(c.player.id))
      .sort((a, b) => b.ovr - a.ovr).slice(0, 8);
    const modal = document.getElementById('modal');
    modal.innerHTML = `
      <div class="modal-box" role="dialog" aria-label="Choose ${pos}">
        <button class="modal-close" aria-label="Close">✕</button>
        <h3>Choose a ${pos}</h3>
        <div class="field"><input id="slotSearch" type="search" placeholder="Search any player…" autocomplete="off"></div>
        <h4>Top ${pos}s</h4>
        <div class="suggest">${suggestions.map((c) => `<button class="pick" data-card="${c.id}">${renderMini(c)}<span>${esc(c.player.name)}</span>
          <span class="muted small">${esc(CARD_TYPES[c.type].short)} · ${fmtCoins(priceInfo(c, state.platform).price)}</span></button>`).join('') || '<p class="muted">No cards for this position.</p>'}</div>
        ${current ? `<button class="btn danger mt" id="removeSlot">Remove ${esc(current.player.name)}</button>` : ''}
      </div>`;
    modal.hidden = false;
    const place = (c) => {
      if (taken.has(c.player.id)) { alert(`${c.player.name} is already in your squad.`); return; }
      squad.slots[i] = c.id; save(); modal.hidden = true; draw();
    };
    modal.querySelectorAll('[data-card]').forEach((b) => b.addEventListener('click', () => place(cardById(b.dataset.card))));
    modal.querySelector('#removeSlot')?.addEventListener('click', () => { delete squad.slots[i]; save(); modal.hidden = true; draw(); });
    const input = modal.querySelector('#slotSearch');
    attachPicker(input, () => game.id, place);
    input.focus();
  };

  draw();
}
