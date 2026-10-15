import { esc } from '../utils.js';
import { state, setState } from '../state.js';
import { GAMES } from '../data/meta.js';

export function render(root) {
  root.innerHTML = `
  <div class="page-head"><div><h1>Settings</h1><p class="muted">Stored only in this browser</p></div></div>
  <section class="panel settings">
    <h3>Video recommendations</h3>
    <p class="muted">Without a key, video picks open as YouTube searches. Add a free
      <a href="https://developers.google.com/youtube/v3/getting-started" target="_blank" rel="noopener">YouTube Data API v3 key</a>
      to watch recommended videos right inside the app.</p>
    <div class="field-row">
      <input id="ytKey" type="password" placeholder="YouTube Data API key" value="${esc(state.ytKey)}" autocomplete="off" aria-label="YouTube API key">
      <button class="btn primary" id="saveKey">Save</button>
      ${state.ytKey ? '<button class="btn ghost" id="clearKey">Remove</button>' : ''}
    </div>
    <p class="small muted" id="keyMsg"></p>
  </section>
  <section class="panel settings">
    <h3>Defaults</h3>
    <div class="field-row">
      <label>Game <select id="game">${GAMES.map((g) => `<option value="${g.id}" ${g.id === state.game ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select></label>
      <label>Platform <select id="platform"><option value="console" ${state.platform === 'console' ? 'selected' : ''}>Console</option><option value="pc" ${state.platform === 'pc' ? 'selected' : ''}>PC</option></select></label>
    </div>
  </section>
  <section class="panel settings">
    <h3>Your data</h3>
    <p class="muted">${state.watchlist.length} cards on your watchlist · ${Object.keys(state.squad).length} saved squad(s)</p>
    <button class="btn danger" id="reset">Clear watchlist &amp; squads</button>
  </section>`;

  const msg = root.querySelector('#keyMsg');
  root.querySelector('#saveKey').addEventListener('click', () => {
    setState({ ytKey: root.querySelector('#ytKey').value.trim() }, { silent: true });
    try { Object.keys(sessionStorage).filter((k) => k.startsWith('yt:')).forEach((k) => sessionStorage.removeItem(k)); } catch { /* ignore */ }
    msg.textContent = state.ytKey ? 'Saved. Open any player or feature to see videos inline.' : 'Key removed.';
  });
  root.querySelector('#clearKey')?.addEventListener('click', () => { setState({ ytKey: '' }, { silent: true }); render(root); });
  root.querySelector('#game').addEventListener('change', (e) => setState({ game: e.target.value }));
  root.querySelector('#platform').addEventListener('change', (e) => setState({ platform: e.target.value }));
  root.querySelector('#reset').addEventListener('click', () => {
    if (!confirm('Clear your watchlist and all saved squads?')) return;
    setState({ watchlist: [], squad: {} });
  });
}
