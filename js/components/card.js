// FUT-style player card and compact row renderers.

import { CARD_TYPES, STAT_LABELS, GK_STAT_LABELS, nationOf, clubShort, playerImageUrl } from '../data/meta.js';
import { esc, initials } from '../utils.js';

export const statLabels = (card) => (card.player.isGK ? GK_STAT_LABELS : STAT_LABELS);
export const cardHref = (card) => `#/player/${card.id}`;
export const typeOf = (card) => CARD_TYPES[card.type];

export function renderCard(card, { size = 'md', link = true } = {}) {
  const p = card.player;
  const t = CARD_TYPES[card.type];
  const nation = nationOf(p.nation);
  const club = clubShort(card.club);
  const labels = statLabels(card);
  const img = playerImageUrl(card);
  const tag = link ? 'a' : 'div';
  const href = link ? ` href="${cardHref(card)}"` : '';
  return `
  <${tag} class="fut-card ${t.cls} size-${size}"${href} title="${esc(p.fullName)} — ${esc(t.label)}">
    <div class="fc-left">
      <div class="fc-ovr">${card.ovr}</div>
      <div class="fc-pos">${esc(p.pos)}</div>
      <div class="fc-flag" title="${esc(nation.name)}">${nation.flag}</div>
      <div class="fc-club">${esc(club)}</div>
    </div>
    <div class="fc-face ${img ? 'has-img' : ''}" aria-hidden="true"><span>${esc(initials(p.name))}</span>${img
      ? `<img src="${esc(img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="${IMG_FALLBACK}">` : ''}</div>
    <div class="fc-name">${esc(p.name)}</div>
    <div class="fc-stats">
      ${card.stats.map((s, i) => `<div><b>${s}</b><span>${labels[i]}</span></div>`).join('')}
    </div>
  </${tag}>`;
}

// On a failed image load, drop it and show the initials again.
const IMG_FALLBACK = "this.parentNode.classList.remove('has-img');this.remove()";

/** Small round headshot (falls back to initials). */
export function avatar(card) {
  const img = playerImageUrl(card);
  return `<span class="avatar ${img ? 'has-img' : ''}" aria-hidden="true"><span>${esc(initials(card.player.name))}</span>${img
    ? `<img src="${esc(img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="${IMG_FALLBACK}">` : ''}</span>`;
}

// Tiny inline card chip used in tables and lists.
export function renderMini(card) {
  const t = CARD_TYPES[card.type];
  return `<span class="mini-card ${t.cls}"><b>${card.ovr}</b><i>${esc(card.player.pos)}</i></span>`;
}

export function stars(n) {
  return `<span class="stars" aria-label="${n} stars">${'★'.repeat(n)}<span class="dim">${'★'.repeat(5 - n)}</span></span>`;
}

export function statClass(v) {
  return v >= 90 ? 's-elite' : v >= 80 ? 's-great' : v >= 70 ? 's-good' : v >= 50 ? 's-ok' : 's-poor';
}
