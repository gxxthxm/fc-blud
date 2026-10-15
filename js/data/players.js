// Player database, loaded from CSV at startup.
//
// Each CSV row is one player in one edition (column `edition`, e.g. "fc27"). Add more files
// to DATA_FILES — or more editions to the same file — and the game selector picks them up.

import { setLoadedGames, typeForRating, FACE_COLUMNS, ATTRIBUTE_COLUMNS } from './meta.js';

export const DATA_FILES = ['players.csv'];
const DEFAULT_EDITION = 'fc27';
const REQUIRED = ['player_id', 'overall_rating', 'position', 'club', 'league', 'nationality', ...FACE_COLUMNS];

export let CARDS = [];
const byId = new Map();
const byGame = new Map();
const byPlayer = new Map();

export const normalize = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// RFC 4180-style parser (quoted fields, escaped quotes, CRLF). Returns arrays of strings.
export function parseCSV(text) {
  const rows = [];
  const n = text.length;
  let row = [];
  let i = text.charCodeAt(0) === 0xfeff ? 1 : 0;
  while (i < n) {
    let field;
    if (text.charCodeAt(i) === 34) {
      let j = i + 1;
      field = '';
      for (;;) {
        const k = text.indexOf('"', j);
        if (k < 0) { field += text.slice(j); i = n; break; }
        field += text.slice(j, k);
        if (text.charCodeAt(k + 1) === 34) { field += '"'; j = k + 2; } else { i = k + 1; break; }
      }
    } else {
      let j = i;
      while (j < n) {
        const c = text.charCodeAt(j);
        if (c === 44 || c === 10 || c === 13) break;
        j++;
      }
      field = text.slice(i, j);
      i = j;
    }
    row.push(field);
    if (text.charCodeAt(i) === 44) {
      i++;
      if (i === n) row.push('');
    } else {
      if (text.charCodeAt(i) === 13) i++;
      if (text.charCodeAt(i) === 10) i++;
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    }
  }
  if (row.length) rows.push(row);
  return rows;
}

function ageAt(birth, onDate) {
  if (!birth) return null;
  const b = new Date(birth);
  const d = onDate ? new Date(onDate) : new Date();
  if (Number.isNaN(b.getTime())) return null;
  let a = d.getFullYear() - b.getFullYear();
  if (d.getMonth() < b.getMonth() || (d.getMonth() === b.getMonth() && d.getDate() < b.getDate())) a--;
  return a;
}

function ingest(rows, file) {
  const header = rows[0].map((h) => h.trim());
  const ix = Object.fromEntries(header.map((h, i) => [h, i]));
  const missing = REQUIRED.filter((c) => !(c in ix));
  if (missing.length) throw new Error(`${file} is missing column(s): ${missing.join(', ')}`);
  const get = (r, c) => (c in ix ? (r[ix[c]] ?? '').trim() : '');
  const attrCols = ATTRIBUTE_COLUMNS.filter((c) => c in ix);

  for (let k = 1; k < rows.length; k++) {
    const r = rows[k];
    const pid = get(r, 'player_id');
    const game = get(r, 'edition') || DEFAULT_EDITION;
    const id = `${pid}-${game}`;
    if (!pid || byId.has(id)) continue;

    const first = get(r, 'first_name');
    const last = get(r, 'last_name');
    const common = get(r, 'common_name');
    const fullName = common || `${first} ${last}`.trim() || pid;
    const pos = get(r, 'position') || 'CM';
    const ovr = +get(r, 'overall_rating') || 0;
    const attrs = {};
    for (const c of attrCols) attrs[c] = +r[ix[c]] || 0;

    const player = {
      id: pid,
      name: common || last || first || pid,
      fullName,
      nation: get(r, 'nationality'),
      pos,
      altPos: get(r, 'alternate_positions').split(/[\s,]+/).filter(Boolean),
      foot: /^l/i.test(get(r, 'preferred_foot')) ? 'L' : 'R',
      sm: +get(r, 'skill_moves') || 1,
      wf: +get(r, 'weak_foot') || 1,
      height: +get(r, 'height_cm') || null,
      weight: +get(r, 'weight_kg') || null,
      playstyles: get(r, 'playstyles').split(',').map((s) => s.trim()).filter(Boolean),
      isGK: pos === 'GK',
      isWomen: /women/i.test(get(r, 'gender')),
      isIcon: false,
      search: normalize(`${fullName} ${common} ${first} ${last}`),
    };
    const card = {
      id, player, game, type: typeForRating(ovr), ovr,
      stats: FACE_COLUMNS.map((c) => +r[ix[c]] || 0),
      attrs,
      club: get(r, 'club'),
      league: get(r, 'league'),
      age: ageAt(get(r, 'birthdate'), get(r, 'snapshot_date')),
      snapshot: get(r, 'snapshot_date'),
    };
    CARDS.push(card);
    byId.set(id, card);
    if (!byGame.has(game)) byGame.set(game, []);
    byGame.get(game).push(card);
    if (!byPlayer.has(pid)) byPlayer.set(pid, []);
    byPlayer.get(pid).push(card);
  }
}

export async function loadData() {
  const texts = await Promise.all(DATA_FILES.map(async (f) => {
    const res = await fetch(f);
    if (!res.ok) throw new Error(`Couldn't load ${f} (HTTP ${res.status})`);
    return [f, await res.text()];
  }));
  for (const [f, t] of texts) ingest(parseCSV(t), f);
  if (!CARDS.length) throw new Error('No players found in ' + DATA_FILES.join(', '));
  for (const list of byGame.values()) list.sort((a, b) => b.ovr - a.ovr);
  setLoadedGames([...byGame.keys()]);
}

export const cardById = (id) => byId.get(id);
/** Cards for an edition, sorted by rating. Shared array — copy before mutating. */
export const cardsForGame = (gameId) => byGame.get(gameId) || [];
export const cardsForPlayer = (playerId, gameId) =>
  (byPlayer.get(playerId) || []).filter((c) => !gameId || c.game === gameId);
export const baseCard = (playerId, gameId) => cardsForPlayer(playerId, gameId)[0];

const leagueCache = new Map();
export function leaguesFor(gameId) {
  if (!leagueCache.has(gameId)) {
    const m = new Map();
    for (const c of cardsForGame(gameId)) {
      if (!m.has(c.league)) m.set(c.league, new Set());
      m.get(c.league).add(c.club);
    }
    leagueCache.set(gameId, m);
  }
  return leagueCache.get(gameId);
}

const nationCache = new Map();
export function nationsFor(gameId) {
  if (!nationCache.has(gameId)) {
    nationCache.set(gameId, [...new Set(cardsForGame(gameId).map((c) => c.player.nation))].sort((a, b) => a.localeCompare(b)));
  }
  return nationCache.get(gameId);
}
