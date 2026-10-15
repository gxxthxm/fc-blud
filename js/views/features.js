import { esc } from '../utils.js';
import { state } from '../state.js';
import { GAMES, gameById } from '../data/meta.js';
import { FEATURES } from '../data/features.js';
import { mountVideos, topicsForFeature } from '../lib/videos.js';

export function render(root, { params }) {
  const gameId = FEATURES[params[0]] ? params[0] : state.game;
  const game = gameById(gameId);
  const feats = FEATURES[gameId] || [];
  const selected = feats.find((f) => f.id === params[1]) || null;

  root.innerHTML = `
  <div class="page-head"><div><h1>Game features</h1><p class="muted">What's new in each edition — pick a feature for guides and videos</p></div></div>
  <div class="tabs">${GAMES.map((g) => `<a href="#/features/${g.id}" class="${g.id === gameId ? 'on' : ''}">${esc(g.short)}</a>`).join('')}</div>
  <div class="feature-layout ${selected ? 'has-detail' : ''}">
    <div class="feature-grid">
      ${feats.map((f) => `
        <a class="feature-tile ${selected?.id === f.id ? 'on' : ''}" href="#/features/${gameId}/${f.id}">
          <span class="tag">${esc(f.tag)}</span>
          <b>${esc(f.name)}</b>
          <p class="muted small">${esc(f.summary)}</p>
          <span class="modes">${f.modes.map((m) => `<i>${esc(m)}</i>`).join('')}</span>
        </a>`).join('')}
    </div>
    ${selected ? `
    <aside class="feature-detail">
      <div class="panel">
        <a class="small" href="#/features/${gameId}">← All ${esc(game.short)} features</a>
        <p class="eyebrow mt">${esc(game.name)} · ${esc(selected.tag)}</p>
        <h2>${esc(selected.name)}</h2>
        <p>${esc(selected.summary)}</p>
        <ul class="checks">${selected.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
        <p class="muted small">Modes: ${esc(selected.modes.join(', '))}</p>
      </div>
      <div id="featVideos"></div>
    </aside>` : ''}
  </div>`;

  if (selected) {
    mountVideos(root.querySelector('#featVideos'), topicsForFeature(selected, gameId), { title: `${selected.name} videos` });
    if (window.innerWidth < 900) root.querySelector('.feature-detail').scrollIntoView({ behavior: 'smooth' });
  }
}
