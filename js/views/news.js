import { esc, timeAgo } from '../utils.js';
import { state } from '../state.js';
import { getNews, NEWS_KINDS } from '../data/news.js';
import { baseCard } from '../data/players.js';
import { renderCard } from '../components/card.js';
import { mountVideos, topicsForNews } from '../lib/videos.js';
import { demoNote } from './shared.js';

export function render(root, { query }) {
  const all = getNews();
  let kind = query.kind || '';
  let selected = all.find((n) => n.id === query.item) || null;

  root.innerHTML = `
  <div class="page-head">
    <div><h1>News, rumors &amp; leaks</h1><p class="muted">Promos, title updates, datamines and community predictions</p></div>
    ${demoNote('Placeholder stories that show how the feed works — connect a real source in js/data/news.js.')}
  </div>
  <div class="tabs" id="kinds">
    <button data-k="" class="${!kind ? 'on' : ''}">All</button>
    ${Object.entries(NEWS_KINDS).map(([k, v]) => `<button data-k="${k}" class="${k === kind ? 'on' : ''}">${v.label}</button>`).join('')}
  </div>
  <div class="news-layout">
    <ul class="news-list" id="list"></ul>
    <aside id="detail" class="news-detail"></aside>
  </div>`;

  const list = root.querySelector('#list');
  const detail = root.querySelector('#detail');

  const drawList = () => {
    const items = all.filter((n) => !kind || n.kind === kind);
    list.innerHTML = items.map((n) => `
      <li><button class="news-item ${selected?.id === n.id ? 'on' : ''}" data-id="${n.id}">
        <div class="ni-top"><span class="kind ${NEWS_KINDS[n.kind].cls}">${NEWS_KINDS[n.kind].label}</span><span class="muted small">${timeAgo(n.date)}</span></div>
        <b>${esc(n.title)}</b>
        <p class="muted small">${esc(n.body)}</p>
        ${n.confidence != null ? `<div class="confidence" title="Community confidence"><i style="width:${n.confidence}%"></i><span>${n.confidence}% likely</span></div>` : ''}
      </button></li>`).join('') || '<li class="muted">No stories in this category.</li>';
  };

  const drawDetail = () => {
    if (!selected) {
      detail.innerHTML = `<div class="panel muted center">Select a story to see the players involved and related videos.</div>`;
      return;
    }
    const cards = selected.players.map((id) => baseCard(id, state.game) || baseCard(id, 'fc26')).filter(Boolean);
    const [fGame, fId] = (selected.feature || '').split('/');
    detail.innerHTML = `
      <div class="panel">
        <span class="kind ${NEWS_KINDS[selected.kind].cls}">${NEWS_KINDS[selected.kind].label}</span>
        <h2>${esc(selected.title)}</h2>
        <p class="muted small">${selected.date.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</p>
        <p>${esc(selected.body)}</p>
        ${selected.confidence != null ? `<div class="confidence big"><i style="width:${selected.confidence}%"></i><span>${selected.confidence}% community confidence</span></div>` : ''}
        ${cards.length ? `<h4 class="mt">Players mentioned</h4><div class="card-row">${cards.map((c) => renderCard(c, { size: 'sm' })).join('')}</div>` : ''}
        ${fId ? `<p class="mt"><a class="btn ghost" href="#/features/${fGame}/${fId}">Read about this feature →</a></p>` : ''}
      </div>
      <div id="newsVideos"></div>`;
    mountVideos(detail.querySelector('#newsVideos'), topicsForNews(selected), { title: 'Related videos' });
  };

  root.querySelector('#kinds').addEventListener('click', (e) => {
    const b = e.target.closest('[data-k]');
    if (!b) return;
    kind = b.dataset.k;
    root.querySelectorAll('#kinds button').forEach((x) => x.classList.toggle('on', x === b));
    drawList();
  });
  list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-id]');
    if (!b) return;
    selected = all.find((n) => n.id === b.dataset.id);
    history.replaceState(null, '', `#/news?item=${selected.id}`);
    drawList();
    drawDetail();
    if (window.innerWidth < 900) detail.scrollIntoView({ behavior: 'smooth' });
  });
  drawList();
  drawDetail();
}
