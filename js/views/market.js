import { esc, fmtCoins } from '../utils.js';
import { state, toggleWatch } from '../state.js';
import { gameById, CARD_TYPES, CURRENT_GAME } from '../data/meta.js';
import { cardById } from '../data/players.js';
import { marketIndex, movers, priceHistory, priceInfo } from '../data/market.js';
import { renderMini, cardHref } from '../components/card.js';
import { lineChart, sparkline } from '../components/charts.js';
import { mountVideos, topicsForMarket } from '../lib/videos.js';
import { changeBadge, coins, demoNote } from './shared.js';

const RANGES = { '24h': 24, '7d': 168, '30d': 720 };
const TABS = {
  risers: { label: 'Risers', sort: (a, b) => b.change24 - a.change24 },
  fallers: { label: 'Fallers', sort: (a, b) => a.change24 - b.change24 },
  expensive: { label: 'Most expensive', sort: (a, b) => b.price - a.price },
  value: { label: 'Best value', sort: (a, b) => b.card.ovr * 1e4 / b.price - a.card.ovr * 1e4 / a.price },
};

const TIPS = [
  ['New content drops at 6PM UK', 'Promo cards and SBCs release at 18:00 UK time. Prices often dip shortly before as people sell to open packs.'],
  ['Buy fodder early in the week', 'High-rated fodder (84–86) climbs when big SBCs land and ahead of weekend rewards.'],
  ['Sell meta cards on Thursday–Friday', 'Demand for strong cards peaks right before competitive weekend play.'],
  ['Factor in the 5% EA tax', 'Every sale loses 5%. A flip needs a margin above that to profit.'],
];

export function render(root, { query }) {
  const game = gameById(state.game);
  let tab = TABS[query.tab] ? query.tab : 'risers';
  const all = movers(state.platform, game.id).filter((m) => m.price >= 1000);
  const idx = marketIndex(state.platform);
  const idxNow = idx[idx.length - 1].p;

  // Average 24h change per league.
  const byLeague = {};
  for (const m of all) (byLeague[m.card.league] ||= []).push(m.change24);
  const leagues = Object.entries(byLeague).map(([l, v]) => [l, v.reduce((s, x) => s + x, 0) / v.length, v.length]).sort((a, b) => b[1] - a[1]);

  root.innerHTML = `
  <div class="page-head">
    <div><h1>Transfer market</h1><p class="muted">${esc(game.short)} · ${state.platform === 'pc' ? 'PC' : 'Console'} market trends</p></div>
    ${demoNote('Prices are simulated for the demo; plug in a live feed for real trading.')}
  </div>
  ${game.id !== CURRENT_GAME ? `<p class="notice">${esc(game.short)} is an archived game. Movers below show final settled prices; the index tracks ${esc(gameById(CURRENT_GAME).short)}.</p>` : ''}

  <section class="panel">
    <div class="panel-head">
      <h3>Market index <span class="idx-now">${idxNow.toFixed(1)}</span> ${changeBadge(((idxNow - idx[idx.length - 25].p) / idx[idx.length - 25].p) * 100)}</h3>
      <div class="seg" id="range">${Object.keys(RANGES).map((k) => `<button data-r="${k}" class="${k === '7d' ? 'on' : ''}">${k}</button>`).join('')}</div>
    </div>
    <div id="idxChart"></div>
    <p class="muted small">Index = average price of the top 60 cards relative to their 30-day average (100 = average).</p>
  </section>

  <div class="grid-2 wide-left">
    <section class="panel">
      <div class="tabs" id="tabs">${Object.entries(TABS).map(([k, t]) => `<button data-t="${k}" class="${k === tab ? 'on' : ''}">${t.label}</button>`).join('')}</div>
      <div id="tabBody"></div>
    </section>
    <section class="panel">
      <div class="panel-head"><h3>Leagues · 24h</h3></div>
      <div class="league-heat">
        ${leagues.map(([l, chg, n]) => `<a href="#/players?league=${encodeURIComponent(l)}&sort=change" class="heat ${chg >= 0 ? 'pos' : 'neg'}" style="--a:${Math.min(1, Math.abs(chg) / 6) * 0.5 + 0.08}">
          <b>${esc(l)}</b><span>${changeBadge(chg)}</span><small class="muted">${n} cards</small></a>`).join('')}
      </div>
    </section>
  </div>

  <div class="grid-2">
    <section class="panel">
      <div class="panel-head"><h3>Your watchlist</h3><span class="muted small">Star cards anywhere to track them</span></div>
      <div id="watchlist"></div>
    </section>
    <section class="panel">
      <div class="panel-head"><h3>Trading tips</h3></div>
      <ul class="tips">${TIPS.map(([t, d]) => `<li><b>${esc(t)}</b><span class="muted small">${esc(d)}</span></li>`).join('')}</ul>
    </section>
  </div>
  <div id="mktVideos"></div>`;

  const chartEl = root.querySelector('#idxChart');
  const draw = (r) => lineChart(chartEl, idx.slice(-RANGES[r]), {
    fmtY: (v) => v.toFixed(1),
    fmtX: r === '24h' ? (t) => new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : undefined,
  });
  draw('7d');
  root.querySelector('#range').addEventListener('click', (e) => {
    const b = e.target.closest('[data-r]');
    if (!b) return;
    root.querySelectorAll('#range button').forEach((x) => x.classList.toggle('on', x === b));
    draw(b.dataset.r);
  });

  const row = (m, i) => `
    <tr>
      <td class="muted">${i + 1}</td><td>${renderMini(m.card)}</td>
      <td><a class="pname" href="${cardHref(m.card)}">${esc(m.card.player.name)}</a><span class="muted small">${esc(CARD_TYPES[m.card.type].label)}</span></td>
      <td>${coins(m.price)}</td><td>${changeBadge(m.change24)}</td>
      <td class="hide-sm">${sparkline(priceHistory(m.card, state.platform).slice(-48).map((x) => x.p), { w: 80, h: 24 })}</td>
    </tr>`;
  const drawTab = () => {
    const list = [...all].sort(TABS[tab].sort).slice(0, 12);
    root.querySelector('#tabBody').innerHTML = `<div class="table-wrap"><table class="ptable compact"><tbody>${list.map(row).join('')}</tbody></table></div>`;
  };
  drawTab();
  root.querySelector('#tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-t]');
    if (!b) return;
    tab = b.dataset.t;
    history.replaceState(null, '', '#/market?tab=' + tab);
    root.querySelectorAll('#tabs button').forEach((x) => x.classList.toggle('on', x === b));
    drawTab();
  });

  const drawWatch = () => {
    const el = root.querySelector('#watchlist');
    const items = state.watchlist.map(cardById).filter(Boolean);
    if (!items.length) { el.innerHTML = '<p class="muted">Nothing here yet — tap ★ on any card.</p>'; return; }
    const total = items.reduce((s, c) => s + priceInfo(c, state.platform).price, 0);
    el.innerHTML = `<div class="table-wrap"><table class="ptable compact"><tbody>
      ${items.map((c) => {
        const m = priceInfo(c, state.platform);
        return `<tr><td>${renderMini(c)}</td><td><a class="pname" href="${cardHref(c)}">${esc(c.player.name)}</a><span class="muted small">${esc(gameById(c.game).short)} · ${esc(CARD_TYPES[c.type].label)}</span></td>
          <td>${coins(m.price)}</td><td>${changeBadge(m.change24)}</td>
          <td><button class="icon-btn watch on" data-unwatch="${c.id}" aria-label="Remove from watchlist">★</button></td></tr>`;
      }).join('')}
    </tbody></table></div><p class="small muted">Watchlist value: <b>${fmtCoins(total)}</b> coins</p>`;
  };
  drawWatch();
  root.querySelector('#watchlist').addEventListener('click', (e) => {
    const b = e.target.closest('[data-unwatch]');
    if (b) { toggleWatch(b.dataset.unwatch); drawWatch(); }
  });

  mountVideos(root.querySelector('#mktVideos'), topicsForMarket(), { title: 'Trading videos' });
}
