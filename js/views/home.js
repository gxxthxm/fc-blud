import { esc, timeAgo } from '../utils.js';
import { state } from '../state.js';
import { gameById, CARD_TYPES } from '../data/meta.js';
import { cardsForGame, cardById } from '../data/players.js';
import { marketIndex, movers } from '../data/market.js';
import { getNews, NEWS_KINDS } from '../data/news.js';
import { FEATURES } from '../data/features.js';
import { renderCard, renderMini, cardHref } from '../components/card.js';
import { lineChart } from '../components/charts.js';
import { mountVideos, topicsForCard, topicsForFeature } from '../lib/videos.js';
import { changeBadge, coins, attachPicker } from './shared.js';

export function render(root) {
  const game = gameById(state.game);
  const cards = cardsForGame(game.id);
  const idx = marketIndex(state.platform).slice(-24 * 7);
  const idxNow = idx[idx.length - 1].p;
  const idxChg = ((idxNow - idx[idx.length - 25].p) / idx[idx.length - 25].p) * 100;
  const mv = movers(state.platform, game.id).filter((m) => m.price >= 1000);
  const risers = [...mv].sort((a, b) => b.change24 - a.change24).slice(0, 5);
  const fallers = [...mv].sort((a, b) => a.change24 - b.change24).slice(0, 5);
  const promos = cards.filter((c) => !['gold', 'icon'].includes(c.type)).sort((a, b) => b.ovr - a.ovr).slice(0, 10);
  const news = getNews().slice(0, 5);
  const feats = FEATURES[game.id] || [];
  const players = new Set(cards.map((c) => c.player.id)).size;

  const moverRow = (m) => `
    <a class="mover" href="${cardHref(m.card)}">
      ${renderMini(m.card)}<span class="mv-name">${esc(m.card.player.name)}<small>${esc(CARD_TYPES[m.card.type].short)}</small></span>
      ${coins(m.price)} ${changeBadge(m.change24)}
    </a>`;

  root.innerHTML = `
  <section class="hero">
    <div>
      <p class="eyebrow">${esc(game.name)} companion</p>
      <h1>Every card, every price, every rumor.</h1>
      <p class="muted">Player database across ${'FIFA 23 → FC 26'}, live-style market trends, news &amp; leaks, squad builder — and video picks for whatever you're looking at.</p>
      <div class="hero-search"><input id="heroSearch" type="search" placeholder="Search ${players} players… try “Mbappé” or “Bonmatí”" autocomplete="off" aria-label="Search players"></div>
    </div>
    <div class="hero-stats">
      <div class="stat-tile"><span>Players</span><b>${players}</b></div>
      <div class="stat-tile"><span>Cards in ${esc(game.short)}</span><b>${cards.length}</b></div>
      <div class="stat-tile"><span>Market index</span><b>${idxNow.toFixed(1)}</b>${changeBadge(idxChg)}</div>
    </div>
  </section>

  <div class="grid-2">
    <section class="panel">
      <div class="panel-head"><h3>Market index · 7 days</h3><a href="#/market" class="small">Full market →</a></div>
      <div id="homeIdx"></div>
      <div class="movers-2">
        <div><h4 class="up-t">Top risers (24h)</h4>${risers.map(moverRow).join('')}</div>
        <div><h4 class="down-t">Top fallers (24h)</h4>${fallers.map(moverRow).join('')}</div>
      </div>
    </section>
    <section class="panel">
      <div class="panel-head"><h3>News, rumors &amp; leaks</h3><a href="#/news" class="small">All news →</a></div>
      <ul class="news-mini">
        ${news.map((n) => `
          <li><a href="#/news?item=${n.id}">
            <span class="kind ${NEWS_KINDS[n.kind].cls}">${NEWS_KINDS[n.kind].label}</span>
            <b>${esc(n.title)}</b>
            <span class="muted small">${timeAgo(n.date)}${n.confidence != null ? ` · ${n.confidence}% confidence` : ''}</span>
          </a></li>`).join('')}
      </ul>
    </section>
  </div>

  <section class="panel">
    <div class="panel-head"><h3>Latest promo cards</h3><a href="#/players?type=promo" class="small">Browse all →</a></div>
    <div class="card-row">${promos.map((c) => renderCard(c, { size: 'sm' })).join('')}</div>
  </section>

  ${feats.length ? `
  <section class="panel">
    <div class="panel-head"><h3>New in ${esc(game.short)}</h3><a href="#/features/${game.id}" class="small">All features →</a></div>
    <div class="feature-grid">
      ${feats.slice(0, 3).map((f) => `
        <a class="feature-tile" href="#/features/${game.id}/${f.id}">
          <span class="tag">${esc(f.tag)}</span><b>${esc(f.name)}</b><p class="muted small">${esc(f.summary)}</p>
        </a>`).join('')}
    </div>
  </section>` : ''}

  <div id="homeVideos"></div>`;

  lineChart(root.querySelector('#homeIdx'), idx, { fmtY: (v) => v.toFixed(1), height: 170 });
  attachPicker(root.querySelector('#heroSearch'), () => state.game, (c) => (location.hash = cardHref(c)));

  const watched = state.watchlist.map(cardById).find((c) => c && c.game === game.id);
  if (watched) mountVideos(root.querySelector('#homeVideos'), topicsForCard(watched), { title: `Because you're watching ${watched.player.name}` });
  else if (feats[0]) mountVideos(root.querySelector('#homeVideos'), topicsForFeature(feats[0], game.id), { title: `Get started with ${feats[0].name}` });
}
