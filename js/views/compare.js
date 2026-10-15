import { esc, toQuery } from '../utils.js';
import { state } from '../state.js';
import { cardById } from '../data/players.js';
import { priceInfo, metaScore } from '../data/market.js';
import { renderCard, statLabels, stars } from '../components/card.js';
import { radar } from '../components/charts.js';
import { mountVideos, topicsForCompare } from '../lib/videos.js';
import { coins, attachPicker } from './shared.js';

const COLORS = ['#22d3ee', '#f472b6'];

export function render(root, { query }) {
  const a = cardById(query.a);
  const b = cardById(query.b);
  const slot = (c, key, i) => `
    <div class="cmp-slot" style="--c:${COLORS[i]}">
      ${c ? renderCard(c, { size: 'md' }) : '<div class="fut-card empty-card size-md">?</div>'}
      <div class="cmp-pick"><input data-slot="${key}" type="search" placeholder="${c ? 'Change player…' : 'Pick a player…'}" aria-label="Pick player ${i + 1}"></div>
    </div>`;

  let body = '<p class="muted center">Pick two cards to compare them side by side.</p>';
  if (a && b) {
    const la = statLabels(a);
    const rows = [
      ['Rating', a.ovr, b.ovr],
      ...a.stats.map((v, i) => [la[i] + (la[i] !== statLabels(b)[i] ? '/' + statLabels(b)[i] : ''), v, b.stats[i]]),
      ['Skill moves', a.player.sm, b.player.sm, stars],
      ['Weak foot', a.player.wf, b.player.wf, stars],
      ['Meta score', metaScore(a), metaScore(b)],
      ['PlayStyle+', a.player.playstyles.filter((s) => s.endsWith('+')).length, b.player.playstyles.filter((s) => s.endsWith('+')).length],
    ];
    const pa = priceInfo(a, state.platform).price;
    const pb = priceInfo(b, state.platform).price;
    body = `
      <div class="cmp-grid">
        <div class="panel center">${radar([{ values: a.stats, color: COLORS[0] }, { values: b.stats, color: COLORS[1] }], la)}
          <div class="legend"><span style="--c:${COLORS[0]}">${esc(a.player.name)}</span><span style="--c:${COLORS[1]}">${esc(b.player.name)}</span></div>
        </div>
        <div class="panel">
          <table class="cmp-table">
            <thead><tr><th style="color:${COLORS[0]}">${esc(a.player.name)}</th><th></th><th style="color:${COLORS[1]}">${esc(b.player.name)}</th></tr></thead>
            <tbody>
              ${rows.map(([label, va, vb, fmt]) => `<tr>
                <td class="${va > vb ? 'win' : ''}">${fmt ? fmt(va) : va}</td><th>${esc(label)}</th><td class="${vb > va ? 'win' : ''}">${fmt ? fmt(vb) : vb}</td></tr>`).join('')}
              <tr><td class="${pa < pb ? 'win' : ''}">${coins(pa)}</td><th>Price</th><td class="${pb < pa ? 'win' : ''}">${coins(pb)}</td></tr>
              <tr><td>${esc(a.club)}</td><th>Club</th><td>${esc(b.club)}</td></tr>
              <tr><td>${a.age ?? '—'}</td><th>Age</th><td>${b.age ?? '—'}</td></tr>
            </tbody>
          </table>
          <p class="muted small">Cheaper price wins its row. Stat labels differ when comparing a GK with an outfield player.</p>
        </div>
      </div>
      <div id="cmpVideos"></div>`;
  }

  root.innerHTML = `
    <div class="page-head"><div><h1>Compare</h1><p class="muted">Head-to-head stats, price and value</p></div></div>
    <section class="panel cmp-head">${slot(a, 'a', 0)}<div class="vs">VS</div>${slot(b, 'b', 1)}</section>
    ${body}`;

  root.querySelectorAll('[data-slot]').forEach((input) =>
    attachPicker(input, () => state.game, (c) => {
      const q = { a: query.a, b: query.b, [input.dataset.slot]: c.id };
      location.hash = '#/compare' + toQuery(q);
    }));
  if (a && b) mountVideos(root.querySelector('#cmpVideos'), topicsForCompare(a, b), { title: `${a.player.name} vs ${b.player.name} videos` });
}
