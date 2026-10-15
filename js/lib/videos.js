// Video recommendation engine.
//
// Builds ranked YouTube "topics" from whatever the user is looking at (a card, a feature,
// a comparison, a news item, the market). With a YouTube Data API key (Settings) it fetches
// real videos and plays them inline; without one, each topic links to a YouTube search.

import { state } from '../state.js';
import { gameById, groupOf } from '../data/meta.js';
import { esc } from '../utils.js';

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const POSITION_TOPICS = {
  GK: ['goalkeeper tips', 'How to defend shots as a keeper'],
  DEF: ['defending tutorial', 'Defend like a pro'],
  MID: ['passing tutorial', 'Control the midfield'],
  ATT: ['finishing tutorial', 'Score more goals'],
};

export function topicsForCard(card) {
  const p = card.player;
  const g = gameById(card.game).short;
  const promo = '';
  const topics = [
    { q: `${p.fullName}${promo} ${g} player review`, label: `${p.name}${promo} review`, kind: 'Review', why: 'In-game review of this exact card' },
    { q: `${p.name} best chemistry style ${g}`, label: `Best chem style for ${p.name}`, kind: 'Build', why: `Get the most out of a ${p.pos}` },
  ];
  const plus = p.playstyles.find((s) => s.endsWith('+'));
  if (plus) topics.push({ q: `${plus.replace('+', ' plus')} playstyle explained ${g}`, label: `${plus} explained`, kind: 'PlayStyle', why: `${p.name} has ${plus}` });
  if (p.sm >= 5) topics.push({ q: `${g} 5 star skill moves tutorial`, label: '5★ skill moves tutorial', kind: 'Tutorial', why: `${p.name} has 5★ skill moves` });
  const [pq, plabel] = POSITION_TOPICS[groupOf(p.pos)];
  topics.push({ q: `${g} ${pq}`, label: plabel, kind: 'Tutorial', why: `Tips for playing ${p.pos}` });
  if (!p.isIcon && card.game !== 'fifa23') topics.push({ q: `${p.name} evolution ${g}`, label: `${p.name} evolutions`, kind: 'Evolution', why: 'Upgrade paths for this player' });
  topics.push({ q: `${p.fullName} ${p.isIcon ? 'career' : 'skills goals'} highlights`, label: `${p.name} real-life highlights`, kind: 'Highlights', why: p.isIcon ? 'Relive the legend' : 'Real-world form drives in-forms' });
  return topics;
}

export function topicsForFeature(feature, gameId) {
  const g = gameById(gameId).short;
  return [
    ...feature.videos.map((q, i) => ({ q, label: cap(q.replace(new RegExp(`^${g}\\s*`, 'i'), '')), kind: i ? 'Tips' : 'Explained', why: `${feature.name} in ${g}` })),
    { q: `${g} ${feature.name} tips and tricks`, label: `${feature.name} tips & tricks`, kind: 'Tips', why: `Master ${feature.name}` },
    { q: `${g} ${feature.modes[0]} beginners guide`, label: `${feature.modes[0]} beginner's guide`, kind: 'Guide', why: `Part of ${feature.modes.join(', ')}` },
  ];
}

export function topicsForCompare(a, b) {
  const g = gameById(a.game).short;
  return [
    { q: `${a.player.name} vs ${b.player.name} ${g}`, label: `${a.player.name} vs ${b.player.name}`, kind: 'Comparison', why: 'Head-to-head reviews' },
    { q: `${a.player.fullName} ${g} review`, label: `${a.player.name} review`, kind: 'Review', why: 'Card A deep-dive' },
    { q: `${b.player.fullName} ${g} review`, label: `${b.player.name} review`, kind: 'Review', why: 'Card B deep-dive' },
    { q: `best ${a.player.pos} ${g} ultimate team`, label: `Best ${a.player.pos}s in ${g}`, kind: 'Meta', why: 'See the meta at this position' },
  ];
}

export function topicsForNews(item) {
  return [
    { q: item.query, label: item.title, kind: 'Coverage', why: 'Videos about this story' },
    { q: `${gameById(state.game).short} ${item.kind === 'market' ? 'trading tips' : 'news today'}`, label: item.kind === 'market' ? 'Trading tips' : 'Latest news roundup', kind: 'Roundup', why: 'Stay current' },
  ];
}

export function topicsForMarket() {
  const g = gameById(state.game).short;
  return [
    { q: `${g} trading tips`, label: 'Trading tips', kind: 'Trading', why: 'Grow your coin balance' },
    { q: `${g} best investments right now`, label: 'Best investments right now', kind: 'Trading', why: 'Cards the community is buying' },
    { q: `${g} market crash explained`, label: 'Why the market crashes', kind: 'Explained', why: 'Understand promo cycles' },
    { q: `${g} mass bidding filter`, label: 'Mass bidding & filters', kind: 'Tutorial', why: 'Low-risk trading method' },
  ];
}

// ---- YouTube Data API ----------------------------------------------------------------

async function searchYouTube(q, max = 4) {
  const ck = 'yt:' + q;
  try {
    const hit = sessionStorage.getItem(ck);
    if (hit) return JSON.parse(hit);
  } catch { /* ignore */ }
  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  Object.entries({ part: 'snippet', type: 'video', videoEmbeddable: 'true', maxResults: max, q, key: state.ytKey })
    .forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url);
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error?.message || `YouTube API error ${res.status}`);
  const data = await res.json();
  const items = (data.items || []).map((it) => ({
    id: it.id.videoId,
    title: decode(it.snippet.title),
    channel: it.snippet.channelTitle,
    thumb: it.snippet.thumbnails?.medium?.url,
  }));
  try { sessionStorage.setItem(ck, JSON.stringify(items)); } catch { /* ignore */ }
  return items;
}

// The API returns HTML-entity-encoded titles; decode to plain text, then escape on render.
const decode = (s) => new DOMParser().parseFromString(s, 'text/html').documentElement.textContent;

const ytSearchUrl = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export function openPlayer(video) {
  const modal = document.getElementById('modal');
  modal.innerHTML = `
    <div class="modal-box video-modal" role="dialog" aria-label="${esc(video.title)}">
      <button class="modal-close" aria-label="Close">✕</button>
      <div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.id)}?autoplay=1"
        title="${esc(video.title)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>
      <div class="video-meta"><b>${esc(video.title)}</b><span>${esc(video.channel)}</span></div>
    </div>`;
  modal.hidden = false;
}

/** Mounts a recommendation panel. `topics` come from one of the topicsFor* builders. */
export function mountVideos(el, topics, { title = 'Recommended videos' } = {}) {
  let active = 0;
  const hasKey = !!state.ytKey;

  const chips = () => topics.map((t, i) =>
    `<button class="chip ${i === active ? 'on' : ''}" data-i="${i}">${esc(t.label)}</button>`).join('');

  const shell = (body) => {
    el.innerHTML = `
      <div class="panel videos">
        <div class="panel-head">
          <h3><span class="yt-dot"></span>${esc(title)}</h3>
          ${hasKey ? '' : '<a class="muted small" href="#/settings">Add a YouTube API key to watch here →</a>'}
        </div>
        ${hasKey ? `<div class="chips">${chips()}</div>` : ''}
        <div class="video-body">${body}</div>
      </div>`;
  };

  if (!hasKey) {
    shell(`<div class="topic-grid">${topics.map((t) => `
      <a class="topic" href="${ytSearchUrl(t.q)}" target="_blank" rel="noopener">
        <span class="topic-kind">${esc(t.kind)}</span>
        <b>${esc(t.label)}</b>
        <span class="muted small">${esc(t.why)}</span>
        <span class="topic-go">Watch on YouTube ↗</span>
      </a>`).join('')}</div>`);
    return;
  }

  const load = async () => {
    const t = topics[active];
    shell(`<div class="video-grid">${'<div class="vcard skeleton"></div>'.repeat(4)}</div>`);
    try {
      const vids = await searchYouTube(t.q);
      const body = vids.length
        ? `<div class="video-grid">${vids.map((v, i) => `
            <button class="vcard" data-v="${i}">
              <img src="${esc(v.thumb)}" alt="" loading="lazy">
              <span class="vplay">▶</span>
              <b>${esc(v.title)}</b><span class="muted small">${esc(v.channel)}</span>
            </button>`).join('')}</div>
           <p class="muted small why">Why: ${esc(t.why)} · <a href="${ytSearchUrl(t.q)}" target="_blank" rel="noopener">more on YouTube ↗</a></p>`
        : `<p class="muted">No videos found. <a href="${ytSearchUrl(t.q)}" target="_blank" rel="noopener">Search YouTube ↗</a></p>`;
      shell(body);
      el.querySelectorAll('[data-v]').forEach((b) => b.addEventListener('click', () => openPlayer(vids[+b.dataset.v])));
    } catch (err) {
      shell(`<p class="error">Couldn't load videos: ${esc(err.message)}. <a href="${ytSearchUrl(t.q)}" target="_blank" rel="noopener">Search YouTube instead ↗</a></p>`);
    }
    bindChips();
  };
  const bindChips = () => el.querySelectorAll('.chip').forEach((c) =>
    c.addEventListener('click', () => { active = +c.dataset.i; load(); }));
  load();
}
