// Global app state persisted to localStorage (game, platform, watchlist, squad, API key).

import { store } from './utils.js';

const listeners = new Set();

export const state = {
  game: store.get('game', null), // validated against the loaded editions at startup
  platform: store.get('platform', 'console'),
  watchlist: store.get('watchlist', []),
  squad: store.get('squad', {}), // { [gameId]: { formation, slots: { [index]: cardId } } }
  ytKey: store.get('ytKey', ''),
};

export function setState(patch, { silent = false } = {}) {
  Object.assign(state, patch);
  for (const [k, v] of Object.entries(patch)) store.set(k, v);
  if (!silent) listeners.forEach((fn) => fn(patch));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const isWatched = (cardId) => state.watchlist.includes(cardId);

export function toggleWatch(cardId) {
  const list = isWatched(cardId) ? state.watchlist.filter((id) => id !== cardId) : [...state.watchlist, cardId];
  setState({ watchlist: list });
  return list.includes(cardId);
}
