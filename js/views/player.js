import { esc, fmtCoins } from '../utils.js';
import { state, isWatched, toggleWatch, setState } from '../state.js';
import { LOADED_GAMES, gameById, nationOf, CARD_TYPES, SUB_STATS, GK_SUB_STATS, CURRENT_GAME } from '../data/meta.js';
import { cardById, cardsForGame, baseCard } from '../data/players.js';
import { priceHistory, priceInfo, metaScore } from '../data/market.js';
import { renderCard, cardHref, statLabels, statClass, stars } from '../components/card.js';
import { lineChart } from '../components/charts.js';
import { mountVideos, topicsForCard } from '../lib/videos.js';
import { changeBadge, coins, demoNote } from './shared.js';

const RANGES = { '24h': 24, '7d': 24 * 7, '30d': 24 * 30 };

function similar(card, n = 8) {
  const dist = (c) => c.stats.reduce((s, v, i) => s + (v - card.stats[i]) ** 2, 0)
    + (c.player.pos === card.player.pos ? 0 : 120) + (c.ovr - card.ovr) ** 2 * 4;
  return cardsForGame(card.game)
    .filter((c) => c.player.id !== card.player.id && c.player.isGK === card.player.isGK && Math.abs(c.ovr - card.ovr) <= 4)
    .map((c) => [dist(c), c])
    .sort((a, b) => a[0] - b[0])
    .slice(0, n)
    .map(([, c]) => c);
}

export function render(root, { params }) {
  const card = cardById(params[0]);
  if (!card) {
    root.innerHTML = `<div class="panel empty"><h2>Player not found</h2><p><a href="#/players">Back to players</a></p></div>`;
    return;
  }
  // Viewing a card from another edition switches the global game selector to match.
  if (card.game !== state.game) setState({ game: card.game }, { silent: true });
  const p = card.player;
  const game = gameById(card.game);
  const nation = nationOf(p.nation);
  const info = priceInfo(card, state.platform);
  const labels = statLabels(card);
  const history = LOADED_GAMES.slice().reverse().map((g) => ({ g: gameById(g), c: baseCard(p.id, g) })).filter((x) => x.c);
  const groups = (p.isGK ? GK_SUB_STATS : SUB_STATS).map((grp) => grp.map(([n, col]) => [n, card.attrs[col] ?? 0]));
  const top = (p.isGK ? GK_SUB_STATS : SUB_STATS).flat()
    .map(([n, col]) => [n, card.attrs[col] ?? 0]).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const archived = card.game !== CURRENT_GAME;
  const watched = isWatched(card.id);

  root.innerHTML = `
  <nav class="crumbs"><a href="#/players">Players</a> / <a href="#/players?league=${encodeURIComponent(card.league)}&club=${encodeURIComponent(card.club)}">${esc(card.club)}</a> / <span>${esc(p.name)}</span></nav>
  <section class="player-hero panel">
    <div class="ph-card">${renderCard(card, { size: 'lg', link: false })}</div>
    <div class="ph-info">
      <p class="eyebrow">${esc(CARD_TYPES[card.type].label)} · ${esc(game.name)}</p>
      <h1>${esc(p.fullName)}</h1>
      <div class="ph-meta">
        <a href="#/players?nation=${encodeURIComponent(p.nation)}">${nation.flag} ${esc(p.nation)}</a>
        <a href="#/players?league=${encodeURIComponent(card.league)}&club=${encodeURIComponent(card.club)}">${esc(card.club)}</a>
        <a href="#/players?league=${encodeURIComponent(card.league)}">${esc(card.league)}</a>
        ${p.isWomen ? '<span>Women’s football</span>' : ''}
      </div>
      <dl class="facts">
        <div><dt>Position</dt><dd>${esc(p.pos)}${p.altPos.length ? ` <span class="muted">(${esc(p.altPos.join(', '))})</span>` : ''}</dd></div>
        <div><dt>Skill moves</dt><dd>${stars(p.sm)}</dd></div>
        <div><dt>Weak foot</dt><dd>${stars(p.wf)}</dd></div>
        <div><dt>Foot</dt><dd>${p.foot === 'L' ? 'Left' : 'Right'}</dd></div>
        ${p.height ? `<div><dt>Height</dt><dd>${p.height} cm</dd></div>` : ''}
        ${card.age ? `<div><dt>Age</dt><dd>${card.age}</dd></div>` : ''}
        <div><dt>Meta score</dt><dd><span class="stat ${statClass(metaScore(card))}">${metaScore(card)}</span></dd></div>
      </dl>
      <div class="playstyles">${p.playstyles.map((s) => `<a href="#/players?ps=${encodeURIComponent(s)}" class="ps ${s.endsWith('+') ? 'plus' : ''}">${esc(s)}</a>`).join('') || '<span class="muted small">No PlayStyles</span>'}</div>
      <div class="ph-actions">
        <button class="btn ${watched ? '' : 'primary'}" id="watchBtn">${watched ? '★ Watching' : '☆ Add to watchlist'}</button>
        <a class="btn ghost" href="#/compare?a=${card.id}">⇄ Compare</a>
        <a class="btn ghost" href="#/squad?add=${card.id}">＋ Add to squad</a>
      </div>
    </div>
    <div class="ph-price">
      <span class="muted small">${state.platform === 'pc' ? 'PC' : 'Console'} price${archived ? ' (archived)' : ''}</span>
      <div class="big-price">${coins(info.price)}</div>
      <div>${changeBadge(info.change24)} <span class="muted small">24h</span> &nbsp; ${changeBadge(info.change7d)} <span class="muted small">7d</span></div>
      <div class="range small muted">7d range: ${fmtCoins(info.low7d)} – ${fmtCoins(info.high7d)}</div>
    </div>
  </section>

  <div class="grid-2 wide-left">
    <section class="panel">
      <div class="panel-head"><h3>Price history</h3>
        <div class="seg" id="range">${Object.keys(RANGES).map((k) => `<button data-r="${k}" class="${k === '7d' ? 'on' : ''}">${k}</button>`).join('')}</div>
      </div>
      <div id="priceChart"></div>
      ${demoNote('Prices are simulated. Connect a price feed in js/data/market.js.')}
    </section>
    <section class="panel">
      <div class="panel-head"><h3>Best attributes</h3></div>
      <div class="top-attrs">
        ${top.map(([n, v]) => `<div><span>${esc(n)}</span><b class="stat ${statClass(v)}">${v}</b></div>`).join('')}
      </div>
      ${history.length > 1 ? `
      <h4 class="mt">Rating across editions</h4>
      <div class="rating-history">
        ${history.map(({ g, c }) => `<a href="${cardHref(c)}" class="rh ${g.id === card.game ? 'on' : ''}">
          <span class="rh-bar" style="height:${Math.max(6, (c.ovr - 45) * 1.8)}px"></span><b>${c.ovr}</b><span class="small muted">${esc(g.short)}</span></a>`).join('')}
      </div>` : ''}
      ${card.snapshot ? `<p class="muted small mt">Data snapshot: ${esc(card.snapshot)}</p>` : ''}
    </section>
  </div>

  <section class="panel">
    <div class="panel-head"><h3>In-game stats</h3><span class="muted small">${p.isGK ? 'Goalkeeping attributes' : 'Detailed attributes'}</span></div>
    <div class="stat-groups">
      ${groups.map((grp, i) => `
        <div class="sg">
          <div class="sg-head"><span>${labels[i]}</span><b class="${statClass(card.stats[i])}">${card.stats[i]}</b></div>
          ${grp.map(([n, v]) => `<div class="sub"><span>${esc(n)}</span><div class="bar"><i class="${statClass(v)}" style="width:${v}%"></i></div><b>${v}</b></div>`).join('')}
        </div>`).join('')}
    </div>
  </section>

  <div id="videos"></div>

  <section class="panel">
    <div class="panel-head"><h3>Similar players</h3><span class="muted small">By stat profile, position &amp; rating</span></div>
    <div class="card-row">${similar(card).map((c) => renderCard(c, { size: 'sm' })).join('')}</div>
  </section>`;

  const chartEl = root.querySelector('#priceChart');
  const hist = priceHistory(card, state.platform);
  const draw = (r) => lineChart(chartEl, hist.slice(-RANGES[r]), {
    fmtY: (v) => fmtCoins(v),
    fmtX: r === '24h' ? (t) => new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : undefined,
    color: info.change7d >= 0 ? 'var(--up)' : 'var(--down)',
  });
  draw('7d');
  root.querySelector('#range').addEventListener('click', (e) => {
    const b = e.target.closest('[data-r]');
    if (!b) return;
    root.querySelectorAll('#range button').forEach((x) => x.classList.toggle('on', x === b));
    draw(b.dataset.r);
  });
  root.querySelector('#watchBtn').addEventListener('click', (e) => {
    const on = toggleWatch(card.id);
    e.currentTarget.textContent = on ? '★ Watching' : '☆ Add to watchlist';
    e.currentTarget.classList.toggle('primary', !on);
  });
  mountVideos(root.querySelector('#videos'), topicsForCard(card), { title: `Videos for ${p.name}` });
  document.title = `${p.name} ${card.ovr} — FC Hub`;
}
