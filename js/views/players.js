import { esc, toQuery, debounce, fmtNum } from '../utils.js';
import { state, isWatched, toggleWatch } from '../state.js';
import { gameById, CARD_TYPES, POSITION_GROUPS, groupOf, nationOf } from '../data/meta.js';
import { cardsForGame, leaguesFor, nationsFor, normalize } from '../data/players.js';
import { priceInfo, priceHistory } from '../data/market.js';
import { renderMini, avatar, cardHref, statLabels, statClass, stars } from '../components/card.js';
import { sparkline } from '../components/charts.js';
import { changeBadge, coins } from './shared.js';

const PAGE = 25;
const DEFAULTS = { q: '', pos: '', league: '', club: '', nation: '', type: '', gender: '', min: '', max: '', sm: '', wf: '', ps: '', sort: 'ovr', page: '1' };
const SORTS = { ovr: 'Rating', price: 'Price', change: '24h change', pac: 'Pace / Diving', sho: 'Shooting', pas: 'Passing', dri: 'Dribbling', def: 'Defending', phy: 'Physical', age: 'Youngest', name: 'Name' };
const STAT_IDX = { pac: 0, sho: 1, pas: 2, dri: 3, def: 4, phy: 5 };

export function render(root, { query }) {
  const f = { ...DEFAULTS, ...query };
  const game = gameById(state.game);
  const allCards = cardsForGame(game.id);
  const leagues = leaguesFor(game.id);
  const playstyles = [...new Set(allCards.flatMap((c) => c.player.playstyles.map((s) => s.replace(/\+$/, ''))))].sort();

  const opt = (val, label, cur) => `<option value="${esc(val)}" ${String(cur) === String(val) ? 'selected' : ''}>${esc(label)}</option>`;
  const clubOptions = () => (f.league && leagues.has(f.league)
    ? [...leagues.get(f.league)].sort().map((c) => opt(c, c, f.club)).join('') : '');

  root.innerHTML = `
  <div class="page-head">
    <div><h1>Players</h1><p class="muted">${esc(game.name)} · ${fmtNum(allCards.length)} players from your database</p></div>
    <div class="demo-note"><b>Prices simulated</b> Player data comes from players.csv; the CSV has no prices.</div>
  </div>
  <form class="filters panel" id="filters" autocomplete="off">
    <input name="q" type="search" placeholder="Name…" value="${esc(f.q)}" aria-label="Player name">
    <select name="pos" aria-label="Position">${opt('', 'All positions', f.pos)}
      ${Object.entries(POSITION_GROUPS).map(([g, list]) => `<optgroup label="${g}">${opt(g, 'All ' + g, f.pos)}${list.map((p) => opt(p, p, f.pos)).join('')}</optgroup>`).join('')}
    </select>
    <select name="type" aria-label="Card type">${opt('', 'All cards', f.type)}${Object.entries(CARD_TYPES).map(([k, t]) => opt(k, t.label, f.type)).join('')}</select>
    <select name="league" aria-label="League">${opt('', 'All leagues', f.league)}${[...leagues.keys()].sort().map((l) => opt(l, l, f.league)).join('')}</select>
    <select name="club" aria-label="Club" ${f.league ? '' : 'disabled'}>${opt('', f.league ? 'All clubs' : 'Pick a league first', f.club)}${clubOptions()}</select>
    <select name="nation" aria-label="Nation">${opt('', 'All nations', f.nation)}
      ${nationsFor(game.id).map((n) => opt(n, `${nationOf(n).flag} ${n}`, f.nation)).join('')}</select>
    <select name="gender" aria-label="Men / Women">${opt('', 'Men & Women', f.gender)}${opt('M', 'Men', f.gender)}${opt('W', 'Women', f.gender)}</select>
    <input name="min" type="number" min="40" max="99" placeholder="Min OVR" value="${esc(f.min)}" aria-label="Minimum rating">
    <input name="max" type="number" min="40" max="99" placeholder="Max OVR" value="${esc(f.max)}" aria-label="Maximum rating">
    <select name="sm" aria-label="Skill moves">${opt('', 'Skills any', f.sm)}${[3, 4, 5].map((n) => opt(n, `${n}★+ skills`, f.sm)).join('')}</select>
    <select name="wf" aria-label="Weak foot">${opt('', 'Weak foot any', f.wf)}${[3, 4, 5].map((n) => opt(n, `${n}★+ weak foot`, f.wf)).join('')}</select>
    <select name="ps" aria-label="PlayStyle">${opt('', 'Any PlayStyle', f.ps)}${playstyles.map((s) => opt(s, s, f.ps) + opt(s + '+', s + '+', f.ps)).join('')}</select>
    <select name="sort" aria-label="Sort">${Object.entries(SORTS).map(([k, l]) => opt(k, 'Sort: ' + l, f.sort)).join('')}</select>
    <button type="reset" class="btn ghost">Reset</button>
  </form>
  <div id="results"></div>`;

  const form = root.querySelector('#filters');
  const results = root.querySelector('#results');

  const apply = (resetPage = true) => {
    const fd = Object.fromEntries(new FormData(form));
    if (fd.league !== f.league) fd.club = '';
    Object.assign(f, { ...fd, club: fd.club ?? '' });
    if (resetPage) f.page = '1';
    const clubSel = form.elements.club;
    clubSel.disabled = !f.league;
    clubSel.innerHTML = opt('', f.league ? 'All clubs' : 'Pick a league first', f.club) + clubOptions();
    history.replaceState(null, '', '#/players' + toQuery(Object.fromEntries(Object.entries(f).filter(([k, v]) => v !== DEFAULTS[k]))));
    draw();
  };

  const draw = () => {
    const q = normalize(f.q.trim());
    const ps = f.ps;
    const list = allCards.filter((c) => {
      const p = c.player;
      if (q && !p.search.includes(q)) return false;
      if (f.pos && !(POSITION_GROUPS[f.pos] ? groupOf(p.pos) === f.pos : p.pos === f.pos || p.altPos.includes(f.pos))) return false;
      if (f.type && c.type !== f.type) return false;
      if (f.league && c.league !== f.league) return false;
      if (f.club && c.club !== f.club) return false;
      if (f.nation && p.nation !== f.nation) return false;
      if (f.gender === 'W' && !p.isWomen) return false;
      if (f.gender === 'M' && p.isWomen) return false;
      if (f.min && c.ovr < +f.min) return false;
      if (f.max && c.ovr > +f.max) return false;
      if (f.sm && p.sm < +f.sm) return false;
      if (f.wf && p.wf < +f.wf) return false;
      if (ps && !(ps.endsWith('+') ? p.playstyles.includes(ps) : p.playstyles.some((s) => s === ps || s === ps + '+'))) return false;
      return true;
    });

    // allCards is already rating-sorted; only re-sort for other keys.
    if (f.sort === 'price') list.sort((a, b) => priceInfo(b, state.platform).price - priceInfo(a, state.platform).price);
    else if (f.sort === 'change') list.sort((a, b) => priceInfo(b, state.platform).change24 - priceInfo(a, state.platform).change24);
    else if (f.sort === 'name') list.sort((a, b) => a.player.name.localeCompare(b.player.name));
    else if (f.sort === 'age') list.sort((a, b) => (a.age ?? 99) - (b.age ?? 99) || b.ovr - a.ovr);
    else if (f.sort in STAT_IDX) {
      // GK face stats share these columns (DIV/HAN/…), so keepers sort after outfielders.
      const i = STAT_IDX[f.sort];
      list.sort((a, b) => (f.pos === 'GK' ? 0 : a.player.isGK - b.player.isGK) || b.stats[i] - a.stats[i] || b.ovr - a.ovr);
    }

    const pages = Math.max(1, Math.ceil(list.length / PAGE));
    const page = Math.min(pages, Math.max(1, +f.page || 1));
    const rows = list.slice((page - 1) * PAGE, page * PAGE);

    results.innerHTML = `
      <p class="muted small">${fmtNum(list.length)} players</p>
      <div class="table-wrap"><table class="ptable">
        <thead><tr><th></th><th>Player</th><th>Price</th><th>24h</th><th class="hide-sm">7d</th><th class="hide-sm">SM / WF</th>
          ${['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'].map((l) => `<th class="hide-md">${l}</th>`).join('')}<th></th></tr></thead>
        <tbody>
        ${rows.map((c) => {
          const p = c.player;
          const { price, change24 } = priceInfo(c, state.platform);
          const spark = priceHistory(c, state.platform).slice(-24 * 7).filter((_, i) => i % 6 === 0).map((x) => x.p);
          return `<tr data-href="${cardHref(c)}">
            <td>${renderMini(c)}</td>
            <td><div class="pcell">${avatar(c)}<div><a class="pname" href="${cardHref(c)}">${esc(p.name)}</a>
              <span class="muted small">${nationOf(p.nation).flag} ${esc(c.club)} · ${esc([p.pos, ...p.altPos].join(', '))}${c.age ? ` · ${c.age}y` : ''}</span></div></div></td>
            <td>${coins(price)}</td>
            <td>${changeBadge(change24)}</td>
            <td class="hide-sm">${sparkline(spark, { w: 84, h: 26 })}</td>
            <td class="hide-sm small">${stars(p.sm)}<br>${stars(p.wf)}</td>
            ${c.stats.map((s, i) => `<td class="hide-md"><span class="stat ${statClass(s)}" title="${statLabels(c)[i]}">${s}</span></td>`).join('')}
            <td><button class="icon-btn watch ${isWatched(c.id) ? 'on' : ''}" data-watch="${c.id}" aria-label="Toggle watchlist" title="Watchlist">★</button></td>
          </tr>`;
        }).join('') || `<tr><td colspan="13" class="empty">No players match these filters.</td></tr>`}
        </tbody>
      </table></div>
      ${pages > 1 ? `<div class="pager">
        <button class="btn ghost" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>← Prev</button>
        <span class="muted">Page ${page} of ${fmtNum(pages)}</span>
        <button class="btn ghost" data-page="${page + 1}" ${page >= pages ? 'disabled' : ''}>Next →</button>
      </div>` : ''}`;
  };

  form.addEventListener('input', debounce((e) => { if (e.target.tagName === 'INPUT') apply(); }, 200));
  form.addEventListener('change', (e) => { if (e.target.tagName === 'SELECT') apply(); });
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
