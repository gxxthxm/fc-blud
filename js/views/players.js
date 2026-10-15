import { esc, toQuery, debounce } from '../utils.js';
import { state, isWatched, toggleWatch } from '../state.js';
import { gameById, LEAGUES, NATIONS, CARD_TYPES, POSITION_GROUPS, groupOf } from '../data/meta.js';
import { cardsForGame } from '../data/players.js';
import { priceInfo, priceHistory } from '../data/market.js';
import { renderMini, cardHref, statLabels, statClass, stars } from '../components/card.js';
import { sparkline } from '../components/charts.js';
import { changeBadge, coins, demoNote } from './shared.js';

const PAGE = 25;
const DEFAULTS = { q: '', pos: '', league: '', nation: '', type: '', gender: '', min: '', max: '', sm: '', wf: '', sort: 'ovr', page: '1' };
const SORTS = { ovr: 'Rating', price: 'Price', change: '24h change', pac: 'Pace', sho: 'Shooting', pas: 'Passing', dri: 'Dribbling', def: 'Defending', phy: 'Physical', name: 'Name' };

export function render(root, { query }) {
  const f = { ...DEFAULTS, ...query };
  const game = gameById(state.game);
  const allCards = cardsForGame(game.id);
  const clubs = [...new Set(allCards.map((c) => c.league))];

  const opt = (val, label, cur) => `<option value="${esc(val)}" ${String(cur) === String(val) ? 'selected' : ''}>${esc(label)}</option>`;
  root.innerHTML = `
  <div class="page-head">
    <div><h1>Players</h1><p class="muted">${esc(game.name)} · every base and promo card</p></div>
    ${demoNote('Ratings and prices are illustrative, not official EA values.')}
  </div>
  <form class="filters panel" id="filters" autocomplete="off">
    <input name="q" type="search" placeholder="Name…" value="${esc(f.q)}" aria-label="Player name">
    <select name="pos" aria-label="Position">${opt('', 'All positions', f.pos)}
      ${Object.entries(POSITION_GROUPS).map(([g, list]) => `<optgroup label="${g}">${opt(g, 'All ' + g, f.pos)}${list.map((p) => opt(p, p, f.pos)).join('')}</optgroup>`).join('')}
    </select>
    <select name="type" aria-label="Card type">${opt('', 'All cards', f.type)}${opt('promo', 'Any promo', f.type)}
      ${Object.entries(CARD_TYPES).map(([k, t]) => opt(k, t.label, f.type)).join('')}</select>
    <select name="league" aria-label="League">${opt('', 'All leagues', f.league)}${LEAGUES.filter((l) => clubs.includes(l)).map((l) => opt(l, l, f.league)).join('')}</select>
    <select name="nation" aria-label="Nation">${opt('', 'All nations', f.nation)}
      ${Object.values(NATIONS).sort((a, b) => a.name.localeCompare(b.name)).map((n) => opt(n.code, `${n.flag} ${n.name}`, f.nation)).join('')}</select>
    <select name="gender" aria-label="Men / Women">${opt('', 'Men & Women', f.gender)}${opt('M', 'Men', f.gender)}${opt('W', 'Women', f.gender)}</select>
    <input name="min" type="number" min="40" max="99" placeholder="Min OVR" value="${esc(f.min)}" aria-label="Minimum rating">
    <input name="max" type="number" min="40" max="99" placeholder="Max OVR" value="${esc(f.max)}" aria-label="Maximum rating">
    <select name="sm" aria-label="Skill moves">${opt('', 'Skills any', f.sm)}${[3, 4, 5].map((n) => opt(n, `${n}★+ skills`, f.sm)).join('')}</select>
    <select name="wf" aria-label="Weak foot">${opt('', 'Weak foot any', f.wf)}${[3, 4, 5].map((n) => opt(n, `${n}★+ weak foot`, f.wf)).join('')}</select>
    <select name="sort" aria-label="Sort">${Object.entries(SORTS).map(([k, l]) => opt(k, 'Sort: ' + l, f.sort)).join('')}</select>
    <button type="reset" class="btn ghost">Reset</button>
  </form>
  <div id="results"></div>`;

  const form = root.querySelector('#filters');
  const results = root.querySelector('#results');

  const apply = (resetPage = true) => {
    const fd = Object.fromEntries(new FormData(form));
    Object.assign(f, fd);
    if (resetPage) f.page = '1';
    history.replaceState(null, '', '#/players' + toQuery(Object.fromEntries(Object.entries(f).filter(([k, v]) => v !== DEFAULTS[k]))));
    draw();
  };

  const draw = () => {
    const norm = (x) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const q = norm(f.q);
    let list = allCards.filter((c) => {
      const p = c.player;
      if (q && !norm(p.name).includes(q) && !norm(p.fullName).includes(q)) return false;
      if (f.pos && !(POSITION_GROUPS[f.pos] ? groupOf(p.pos) === f.pos : p.pos === f.pos || p.altPos.includes(f.pos))) return false;
      if (f.type === 'promo' ? ['gold', 'icon'].includes(c.type) : f.type && c.type !== f.type) return false;
      if (f.league && c.league !== f.league) return false;
      if (f.nation && p.nation !== f.nation) return false;
      if (f.gender === 'W' && !p.isWomen) return false;
      if (f.gender === 'M' && p.isWomen) return false;
      if (f.min && c.ovr < +f.min) return false;
      if (f.max && c.ovr > +f.max) return false;
      if (f.sm && p.sm < +f.sm) return false;
      if (f.wf && p.wf < +f.wf) return false;
      return true;
    }).map((c) => ({ c, ...priceInfo(c, state.platform) }));

    const statIdx = { pac: 0, sho: 1, pas: 2, dri: 3, def: 4, phy: 5 };
    const key = {
      ovr: (r) => r.c.ovr * 1e9 + r.price, price: (r) => r.price, change: (r) => r.change24,
      name: (r) => r.c.player.name,
    }[f.sort] || ((r) => r.c.stats[statIdx[f.sort]]);
    list.sort((a, b) => (f.sort === 'name' ? key(a).localeCompare(key(b)) : key(b) - key(a)));

    const pages = Math.max(1, Math.ceil(list.length / PAGE));
    const page = Math.min(pages, Math.max(1, +f.page || 1));
    const rows = list.slice((page - 1) * PAGE, page * PAGE);

    results.innerHTML = `
      <p class="muted small">${list.length} cards</p>
      <div class="table-wrap"><table class="ptable">
        <thead><tr><th></th><th>Player</th><th>Price</th><th>24h</th><th class="hide-sm">7d</th><th class="hide-sm">SM / WF</th>
          ${['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'].map((l) => `<th class="hide-md">${l}</th>`).join('')}<th></th></tr></thead>
        <tbody>
        ${rows.map(({ c, price, change24 }) => {
          const p = c.player;
          const spark = priceHistory(c, state.platform).slice(-24 * 7).filter((_, i) => i % 6 === 0).map((x) => x.p);
          return `<tr data-href="${cardHref(c)}">
            <td>${renderMini(c)}</td>
            <td><a class="pname" href="${cardHref(c)}">${esc(p.name)}</a>
              <span class="muted small">${NATIONS[p.nation]?.flag || ''} ${esc(c.club)} · ${esc(CARD_TYPES[c.type].label)} · ${esc([p.pos, ...p.altPos].join(', '))}</span></td>
            <td>${coins(price)}</td>
            <td>${changeBadge(change24)}</td>
            <td class="hide-sm">${sparkline(spark, { w: 84, h: 26 })}</td>
            <td class="hide-sm small">${stars(p.sm)}<br>${stars(p.wf)}</td>
            ${c.stats.map((s, i) => `<td class="hide-md"><span class="stat ${statClass(s)}" title="${statLabels(c)[i]}">${s}</span></td>`).join('')}
            <td><button class="icon-btn watch ${isWatched(c.id) ? 'on' : ''}" data-watch="${c.id}" aria-label="Toggle watchlist" title="Watchlist">★</button></td>
          </tr>`;
        }).join('') || `<tr><td colspan="13" class="empty">No cards match these filters.</td></tr>`}
        </tbody>
      </table></div>
      ${pages > 1 ? `<div class="pager">
        <button class="btn ghost" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>← Prev</button>
        <span class="muted">Page ${page} of ${pages}</span>
        <button class="btn ghost" data-page="${page + 1}" ${page >= pages ? 'disabled' : ''}>Next →</button>
      </div>` : ''}`;
  };

  form.addEventListener('input', debounce(() => apply(), 150));
  form.addEventListener('change', () => apply());
  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('reset', (e) => {
    e.preventDefault();
    for (const el of form.elements) if (el.name) el.value = DEFAULTS[el.name] ?? '';
    apply();
  });
  results.addEventListener('click', (e) => {
    const w = e.target.closest('[data-watch]');
    if (w) { w.classList.toggle('on', toggleWatch(w.dataset.watch)); return; }
    const pg = e.target.closest('[data-page]');
    if (pg) { f.page = pg.dataset.page; apply(false); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const tr = e.target.closest('tr[data-href]');
    if (tr && !e.target.closest('a')) location.hash = tr.dataset.href;
  });
  draw();
}
