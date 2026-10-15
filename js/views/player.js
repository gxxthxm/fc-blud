import { esc, rng, hash, clamp, fmtCoins } from '../utils.js';
import { state, isWatched, toggleWatch, setState } from '../state.js';
import { GAMES, gameById, NATIONS, CARD_TYPES, SUB_STATS, CURRENT_GAME } from '../data/meta.js';
import { cardById, cardsForPlayer, cardsForGame, baseCard } from '../data/players.js';
import { priceHistory, priceInfo, metaScore } from '../data/market.js';
import { renderCard, renderMini, cardHref, statLabels, statClass, stars } from '../components/card.js';
import { lineChart } from '../components/charts.js';
import { mountVideos, topicsForCard } from '../lib/videos.js';
import { changeBadge, coins, demoNote } from './shared.js';

const RANGES = { '24h': 24, '7d': 24 * 7, '30d': 24 * 30 };

// Detailed attributes are estimated around each face stat (the demo dataset only stores face stats).
function subStats(card) {
  const r = rng(hash(card.id + 'sub'));
  return SUB_STATS.map((names, i) => names.map((n) => [n, clamp(card.stats[i] + Math.round((r() - 0.5) * 8), 20, 99)]));
}

function similar(card, n = 6) {
  const pool = cardsForGame(card.game).filter((c) => c.player.id !== card.player.id && c.player.isGK === card.player.isGK && (c.type === 'gold' || c.type === 'icon'));
  const dist = (c) => c.stats.reduce((s, v, i) => s + (v - card.stats[i]) ** 2, 0) + (c.player.pos === card.player.pos ? 0 : 120) + (c.ovr - card.ovr) ** 2 * 4;
  return pool.sort((a, b) => dist(a) - dist(b)).slice(0, n);
}

export function render(root, { params }) {
  let card = cardById(params[0]);
  if (!card) {
    root.innerHTML = `<div class="panel empty"><h2>Card not found</h2><p><a href="#/players">Back to players</a></p></div>`;
    return;
  }
  // Viewing a card from another game switches the global game selector to match.
  if (card.game !== state.game) setState({ game: card.game }, { silent: true });
  const p = card.player;
  const game = gameById(card.game);
  const nation = NATIONS[p.nation];
  const info = priceInfo(card, state.platform);
  const labels = statLabels(card);
  const versions = cardsForPlayer(p.id, card.game);
  const history = GAMES.slice().reverse().map((g) => ({ g, c: baseCard(p.id, g.id) })).filter((x) => x.c);
  const archived = card.game !== CURRENT_GAME;
  const watched = isWatched(card.id);

  root.innerHTML = `
  <nav class="crumbs"><a href="#/players">Players</a> / <span>${esc(p.name)}</span></nav>
  <section class="player-hero panel">
    <div class="ph-card">${renderCard(card, { size: 'lg', link: false })}</div>
    <div class="ph-info">
      <p class="eyebrow">${esc(CARD_TYPES[card.type].label)} · ${esc(game.name)}</p>
      <h1>${esc(p.fullName)}</h1>
      <div class="ph-meta">
        <span>${nation?.flag || ''} ${esc(nation?.name)}</span><span>${esc(card.club)}</span><span>${esc(card.league)}</span>
      </div>
      <dl class="facts">
        <div><dt>Position</dt><dd>${esc(p.pos)}${p.altPos.length ? ` <span class="muted">(${esc(p.altPos.join(', '))})</span>` : ''}</dd></div>
        <div><dt>Skill moves</dt><dd>${stars(p.sm)}</dd></div>
        <div><dt>Weak foot</dt><dd>${stars(p.wf)}</dd></div>
        <div><dt>Foot</dt><dd>${p.foot === 'L' ? 'Left' : 'Right'}</dd></div>
        <div><dt>Height</dt><dd>${p.height} cm</dd></div>
        <div><dt>Age</dt><dd>${card.age}</dd></div>
        <div><dt>Meta score</dt><dd><span class="stat ${statClass(metaScore(card))}">${metaScore(card)}</span></dd></div>
      </dl>
      <div class="playstyles">${p.playstyles.map((s) => `<span class="ps ${s.endsWith('+') ? 'plus' : ''}">${esc(s)}</span>`).join('')}</div>
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
      ${demoNote('Simulated market. Connect a price feed in js/data/market.js.')}
    </section>
    <section class="panel">
      <div class="panel-head"><h3>Versions in ${esc(game.short)}</h3></div>
      <div class="versions">
        ${versions.map((v) => `<a class="version ${v.id === card.id ? 'on' : ''}" href="${cardHref(v)}">
          ${renderMini(v)}<span>${esc(CARD_TYPES[v.type].label)}</span>${coins(priceInfo(v, state.platform).price)}</a>`).join('')}
      </div>
      <h4 class="mt">Rating across games</h4>
      <div class="rating-history">
        ${history.map(({ g, c }) => `<a href="${cardHref(c)}" class="rh ${g.id === card.game ? 'on' : ''}">
          <span class="rh-bar" style="height:${(c.ovr - 60) * 2.4}px"></span><b>${c.ovr}</b><span class="small muted">${esc(g.short)}</span></a>`).join('')}
      </div>
    </section>
  </div>

  <section class="panel">
    <div class="panel-head"><h3>In-game stats</h3><span class="muted small">${p.isGK ? 'Goalkeeping face stats' : 'Detailed attributes are estimates'}</span></div>
    <div class="stat-groups">
      ${p.isGK
        ? card.stats.map((v, i) => `<div class="sg"><div class="sg-head"><span>${labels[i]}</span><b class="${statClass(v)}">${v}</b></div><div class="bar"><i class="${statClass(v)}" style="width:${v}%"></i></div></div>`).join('')
        : subStats(card).map((grp, i) => `
          <div class="sg">
            <div class="sg-head"><span>${labels[i]}</span><b class="${statClass(card.stats[i])}">${card.stats[i]}</b></div>
            ${grp.map(([n, v]) => `<div class="sub"><span>${esc(n)}</span><div class="bar"><i class="${statClass(v)}" style="width:${v}%"></i></div><b>${v}</b></div>`).join('')}
          </div>`).join('')}
    </div>
  </section>

  <div id="videos"></div>

  <section class="panel">
    <div class="panel-head"><h3>Similar players</h3><span class="muted small">By stat profile &amp; position</span></div>
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
  document.title = `${p.name} ${card.ovr} ${CARD_TYPES[card.type].short} — FC Hub`;
}
