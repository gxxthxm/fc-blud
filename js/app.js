// App shell: header controls, hash router, global search and modal handling.

import { $, parseQuery } from './utils.js';
import { state, setState, subscribe } from './state.js';
import { GAMES } from './data/meta.js';
import { cardById, baseCard } from './data/players.js';
import { cardHref } from './components/card.js';
import { attachPicker } from './views/shared.js';
import * as home from './views/home.js';
import * as players from './views/players.js';
import * as player from './views/player.js';
import * as compare from './views/compare.js';
import * as market from './views/market.js';
import * as news from './views/news.js';
import * as features from './views/features.js';
import * as squad from './views/squad.js';
import * as settings from './views/settings.js';

const ROUTES = [
  [/^\/$/, home, 'home'],
  [/^\/players$/, players, 'players'],
  [/^\/player\/([\w-]+)$/, player, 'players'],
  [/^\/compare$/, compare, 'compare'],
  [/^\/market$/, market, 'market'],
  [/^\/news$/, news, 'news'],
  [/^\/features(?:\/([\w-]+))?(?:\/([\w-]+))?$/, features, 'features'],
  [/^\/squad$/, squad, 'squad'],
  [/^\/settings$/, settings, 'settings'],
];

const main = $('#main');
let lastPath = null;

function route() {
  const raw = location.hash.slice(1) || '/';
  const [path, qs] = raw.split('?');
  const hit = ROUTES.map(([re, view, nav]) => ({ m: path.match(re), view, nav })).find((r) => r.m);
  closeModal();
  document.title = 'FC Hub — EA FC & FIFA companion';
  syncHeader();
  document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('on', a.dataset.nav === hit?.nav));
  if (!hit) {
    main.innerHTML = `<div class="panel empty"><h2>Page not found</h2><p><a href="#/">Go home</a></p></div>`;
    return;
  }
  try {
    hit.view.render(main, { params: hit.m.slice(1), query: parseQuery(qs) });
  } catch (err) {
    console.error(err);
    main.innerHTML = `<div class="panel empty"><h2>Something went wrong</h2><p class="muted">${String(err.message)}</p></div>`;
  }
  if (path !== lastPath) window.scrollTo(0, 0);
  lastPath = path;
  syncHeader();
  $('#nav').classList.remove('open');
}

function syncHeader() {
  $('#gameSelect').value = state.game;
  $('#platformSelect').value = state.platform;
}

// Header controls
$('#gameSelect').innerHTML = GAMES.map((g) => `<option value="${g.id}">${g.short}</option>`).join('');
$('#gameSelect').addEventListener('change', (e) => {
  const game = e.target.value;
  // On a player page, jump to the same player's card in the newly selected game.
  const m = location.hash.match(/^#\/player\/([\w-]+)/);
  setState({ game }, { silent: !!m });
  if (m) {
    const card = cardById(m[1]);
    const alt = card && baseCard(card.player.id, game);
    location.hash = alt ? cardHref(alt) : '#/players';
  }
});
$('#platformSelect').addEventListener('change', (e) => setState({ platform: e.target.value }));
$('#menuBtn').addEventListener('click', () => $('#nav').classList.toggle('open'));

const search = $('#globalSearch');
attachPicker(search, () => state.game, (c) => (location.hash = cardHref(c)));
search.closest('form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (search.value.trim()) location.hash = '#/players?q=' + encodeURIComponent(search.value.trim());
  search.value = '';
  search.blur();
});
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) {
    e.preventDefault();
    search.focus();
  }
  if (e.key === 'Escape') closeModal();
});

// Modal (video player, squad slot picker)
const modal = $('#modal');
function closeModal() {
  if (modal.hidden) return;
  modal.hidden = true;
  modal.innerHTML = ''; // stops any playing video
}
modal.addEventListener('click', (e) => {
  if (e.target === modal || e.target.closest('.modal-close')) closeModal();
});

subscribe((patch) => {
  if ('game' in patch || 'platform' in patch || 'watchlist' in patch || 'squad' in patch) {
    if ('watchlist' in patch && !('game' in patch) && Object.keys(patch).length === 1) return; // star toggles update in place
    route();
  }
});

window.addEventListener('hashchange', route);
route();
