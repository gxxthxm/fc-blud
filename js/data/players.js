// Seed player database.
//
// NOTE: this is a DEMO dataset. Ratings are approximate/illustrative and are NOT official EA values.
// Swap `RAW` (or the whole module) for a real data source to make the app production-ready.
//
// Row: id, display name, full name, nation, club (latest game), position, alt positions, foot,
//      skill moves, weak foot, age (in FC 26), height cm, [OVR, 6 face stats] for FC 26,
//      OVR in older games, club in older games (if different), PlayStyles ('+' = PlayStyle+), kind.

import { CLUBS, GAMES, CARD_TYPES } from './meta.js';
import { rng, hash, clamp } from '../utils.js';

const PSG = 'Paris Saint-Germain';
const RAW = [
  ['mbappe', 'Mbappé', 'Kylian Mbappé', 'FRA', 'Real Madrid', 'ST', ['LW'], 'R', 5, 4, 26, 178, [91, 97, 90, 80, 92, 36, 78], { fc25: 91, fc24: 91, fifa23: 91 }, { fc24: PSG, fifa23: PSG }, ['Quick Step+', 'Finesse Shot', 'Rapid', 'Trivela', 'Acrobatic']],
  ['haaland', 'Haaland', 'Erling Haaland', 'NOR', 'Manchester City', 'ST', [], 'L', 3, 3, 25, 195, [90, 86, 92, 66, 80, 45, 88], { fc25: 91, fc24: 91, fifa23: 88 }, {}, ['Power Shot+', 'Acrobatic', 'Bruiser', 'Aerial']],
  ['salah', 'Salah', 'Mohamed Salah', 'EGY', 'Liverpool', 'RW', ['RM'], 'L', 4, 3, 33, 175, [91, 89, 88, 86, 89, 45, 76], { fc25: 89, fc24: 89, fifa23: 90 }, {}, ['Finesse Shot+', 'Incisive Pass', 'Technical', 'Quick Step']],
  ['bellingham', 'Bellingham', 'Jude Bellingham', 'ENG', 'Real Madrid', 'CAM', ['CM'], 'R', 4, 4, 22, 186, [89, 80, 85, 84, 88, 77, 84], { fc25: 90, fc24: 86, fifa23: 84 }, { fifa23: 'Borussia Dortmund' }, ['Relentless+', 'Intercept', 'Power Shot', 'Press Proven']],
  ['vandijk', 'van Dijk', 'Virgil van Dijk', 'NED', 'Liverpool', 'CB', [], 'R', 2, 3, 34, 195, [90, 73, 60, 72, 72, 90, 86], { fc25: 89, fc24: 89, fifa23: 90 }, {}, ['Aerial+', 'Anticipate+', 'Block', 'Long Ball Pass']],
  ['rodri', 'Rodri', 'Rodrigo Hernández', 'ESP', 'Manchester City', 'CDM', ['CM'], 'R', 3, 4, 29, 191, [89, 66, 79, 86, 84, 87, 85], { fc25: 91, fc24: 90, fifa23: 89 }, {}, ['Tiki Taka+', 'Intercept', 'Long Ball Pass', 'Power Shot']],
  ['dembele', 'Dembélé', 'Ousmane Dembélé', 'FRA', PSG, 'ST', ['RW'], 'R', 5, 5, 28, 178, [90, 92, 86, 84, 90, 40, 70], { fc25: 86, fc24: 86, fifa23: 84 }, { fifa23: 'FC Barcelona' }, ['Rapid+', 'Technical', 'Trivela', 'Flair']],
  ['kane', 'Kane', 'Harry Kane', 'ENG', 'FC Bayern München', 'ST', ['CF'], 'R', 3, 5, 32, 188, [89, 68, 93, 84, 83, 49, 82], { fc25: 90, fc24: 90, fifa23: 89 }, { fifa23: 'Tottenham Hotspur' }, ['Power Shot+', 'Incisive Pass', 'Dead Ball', 'Low Driven Shot']],
  ['yamal', 'Lamine Yamal', 'Lamine Yamal', 'ESP', 'FC Barcelona', 'RW', ['RM'], 'L', 4, 4, 18, 180, [89, 87, 80, 85, 91, 30, 60], { fc25: 81, fc24: 75 }, {}, ['Trivela+', 'Technical+', 'Finesse Shot', 'Incisive Pass']],
  ['vinicius', 'Vini Jr.', 'Vinícius José de Oliveira Júnior', 'BRA', 'Real Madrid', 'LW', ['ST'], 'R', 5, 4, 25, 176, [89, 95, 84, 81, 91, 29, 69], { fc25: 90, fc24: 89, fifa23: 86 }, {}, ['Rapid+', 'Flair', 'Quick Step', 'Trickster']],
  ['pedri', 'Pedri', 'Pedro González López', 'ESP', 'FC Barcelona', 'CM', ['CAM'], 'R', 4, 4, 22, 174, [88, 77, 74, 87, 89, 72, 70], { fc25: 86, fc24: 86, fifa23: 85 }, {}, ['Tiki Taka+', 'Press Proven', 'Incisive Pass', 'Technical']],
  ['vitinha', 'Vitinha', 'Vitor Machado Ferreira', 'POR', PSG, 'CM', ['CDM'], 'R', 4, 4, 25, 172, [88, 76, 76, 88, 90, 74, 68], { fc25: 85, fc24: 82, fifa23: 80 }, {}, ['Tiki Taka+', 'Press Proven', 'Long Ball Pass']],
  ['hakimi', 'Hakimi', 'Achraf Hakimi', 'MAR', PSG, 'RB', ['RWB', 'RM'], 'R', 4, 3, 26, 181, [89, 92, 74, 82, 83, 80, 79], { fc25: 85, fc24: 84, fifa23: 84 }, {}, ['Rapid+', 'Whipped Pass', 'Jockey', 'Relentless']],
  ['donnarumma', 'Donnarumma', 'Gianluigi Donnarumma', 'ITA', 'Manchester City', 'GK', [], 'R', 1, 3, 26, 196, [89, 89, 84, 75, 90, 52, 86], { fc25: 89, fc24: 87, fifa23: 88 }, { fc25: PSG, fc24: PSG, fifa23: PSG }, ['Far Reach+', 'Footwork', 'Cross Claimer']],
  ['alisson', 'Alisson', 'Alisson Becker', 'BRA', 'Liverpool', 'GK', [], 'R', 1, 3, 32, 193, [89, 86, 86, 85, 89, 53, 90], { fc25: 89, fc24: 89, fifa23: 89 }, {}, ['Rush Out+', 'Far Throw', 'Deflector']],
  ['courtois', 'Courtois', 'Thibaut Courtois', 'BEL', 'Real Madrid', 'GK', [], 'L', 1, 3, 33, 199, [89, 86, 89, 76, 90, 46, 90], { fc25: 90, fc24: 90, fifa23: 90 }, {}, ['Far Reach+', 'Cross Claimer', 'Footwork']],
  ['debruyne', 'De Bruyne', 'Kevin De Bruyne', 'BEL', 'Napoli', 'CM', ['CAM'], 'R', 4, 5, 34, 181, [87, 66, 85, 93, 85, 63, 74], { fc25: 90, fc24: 91, fifa23: 91 }, { fc25: 'Manchester City', fc24: 'Manchester City', fifa23: 'Manchester City' }, ['Incisive Pass+', 'Whipped Pass+', 'Dead Ball', 'Power Shot']],
  ['musiala', 'Musiala', 'Jamal Musiala', 'GER', 'FC Bayern München', 'CAM', ['LW'], 'R', 5, 4, 22, 184, [87, 83, 80, 82, 91, 60, 63], { fc25: 88, fc24: 86, fifa23: 86 }, {}, ['Technical+', 'Press Proven', 'Rapid', 'Flair']],
  ['wirtz', 'Wirtz', 'Florian Wirtz', 'GER', 'Liverpool', 'CAM', ['CM'], 'R', 4, 4, 22, 177, [89, 80, 83, 88, 91, 54, 65], { fc25: 88, fc24: 85, fifa23: 82 }, { fc25: 'Bayer 04 Leverkusen', fc24: 'Bayer 04 Leverkusen', fifa23: 'Bayer 04 Leverkusen' }, ['Incisive Pass+', 'Technical', 'Finesse Shot', 'Tiki Taka']],
  ['saka', 'Saka', 'Bukayo Saka', 'ENG', 'Arsenal', 'RW', ['RM'], 'L', 4, 3, 24, 178, [88, 86, 83, 85, 88, 64, 70], { fc25: 87, fc24: 86, fifa23: 82 }, {}, ['Finesse Shot+', 'Whipped Pass', 'Technical', 'Quick Step']],
  ['rice', 'Rice', 'Declan Rice', 'ENG', 'Arsenal', 'CM', ['CDM'], 'R', 3, 3, 26, 185, [87, 75, 72, 83, 80, 85, 85], { fc25: 87, fc24: 85, fifa23: 84 }, { fifa23: 'West Ham United' }, ['Intercept+', 'Relentless', 'Dead Ball', 'Long Ball Pass']],
  ['odegaard', 'Ødegaard', 'Martin Ødegaard', 'NOR', 'Arsenal', 'CAM', ['CM'], 'L', 4, 3, 26, 178, [87, 72, 80, 90, 88, 62, 64], { fc25: 89, fc24: 89, fifa23: 87 }, {}, ['Incisive Pass+', 'Tiki Taka', 'Finesse Shot', 'Press Proven']],
  ['lautaro', 'Lautaro', 'Lautaro Martínez', 'ARG', 'Inter', 'ST', [], 'R', 4, 3, 28, 174, [88, 81, 88, 74, 84, 48, 82], { fc25: 89, fc24: 89, fifa23: 86 }, {}, ['Acrobatic+', 'Power Shot', 'Bruiser', 'Low Driven Shot']],
  ['messi', 'Messi', 'Lionel Messi', 'ARG', 'Inter Miami CF', 'RW', ['CF', 'CAM'], 'L', 4, 4, 38, 170, [86, 78, 87, 89, 90, 33, 64], { fc25: 88, fc24: 90, fifa23: 91 }, { fifa23: PSG }, ['Dead Ball+', 'Incisive Pass+', 'Technical', 'Finesse Shot']],
  ['ronaldo', 'Ronaldo', 'Cristiano Ronaldo', 'POR', 'Al Nassr', 'ST', [], 'R', 5, 4, 40, 187, [85, 77, 88, 75, 79, 34, 76], { fc25: 86, fc24: 86, fifa23: 90 }, { fifa23: 'Manchester United' }, ['Power Shot+', 'Aerial', 'Acrobatic', 'Power Header']],
  ['kimmich', 'Kimmich', 'Joshua Kimmich', 'GER', 'FC Bayern München', 'CDM', ['RB', 'CM'], 'R', 3, 4, 30, 177, [89, 68, 74, 88, 82, 84, 73], { fc25: 86, fc24: 88, fifa23: 89 }, {}, ['Long Ball Pass+', 'Dead Ball', 'Intercept', 'Whipped Pass']],
  ['saliba', 'Saliba', 'William Saliba', 'FRA', 'Arsenal', 'CB', [], 'R', 2, 3, 24, 192, [88, 82, 40, 68, 72, 88, 82], { fc25: 87, fc24: 84, fifa23: 82 }, {}, ['Anticipate+', 'Jockey', 'Block', 'Slide Tackle']],
  ['dias', 'Rúben Dias', 'Rúben Dias', 'POR', 'Manchester City', 'CB', [], 'R', 2, 3, 28, 187, [88, 64, 39, 68, 68, 88, 86], { fc25: 88, fc24: 89, fifa23: 88 }, {}, ['Block+', 'Bruiser', 'Aerial', 'Anticipate']],
  ['foden', 'Foden', 'Phil Foden', 'ENG', 'Manchester City', 'CAM', ['RW', 'LW'], 'L', 4, 3, 25, 171, [87, 85, 81, 85, 89, 56, 61], { fc25: 88, fc24: 85, fifa23: 85 }, {}, ['Technical+', 'Finesse Shot', 'Press Proven', 'Quick Step']],
  ['son', 'Son', 'Heung-min Son', 'KOR', 'LAFC', 'LW', ['ST'], 'R', 4, 5, 33, 183, [86, 86, 87, 81, 84, 42, 70], { fc25: 87, fc24: 87, fifa23: 89 }, { fc25: 'Tottenham Hotspur', fc24: 'Tottenham Hotspur', fifa23: 'Tottenham Hotspur' }, ['Finesse Shot+', 'Low Driven Shot', 'Rapid', 'Chip Shot']],
  ['griezmann', 'Griezmann', 'Antoine Griezmann', 'FRA', 'Atlético de Madrid', 'ST', ['CAM'], 'L', 4, 4, 34, 176, [86, 77, 86, 85, 86, 55, 72], { fc25: 88, fc24: 88, fifa23: 85 }, {}, ['Incisive Pass+', 'Dead Ball', 'Chip Shot', 'Relentless']],
  ['leao', 'Leão', 'Rafael Leão', 'POR', 'AC Milan', 'LW', ['ST'], 'R', 5, 4, 26, 188, [86, 93, 78, 77, 87, 30, 77], { fc25: 86, fc24: 86, fifa23: 84 }, {}, ['Rapid+', 'Flair', 'Trickster', 'Quick Step']],
  ['kvaratskhelia', 'Kvaratskhelia', 'Khvicha Kvaratskhelia', 'GEO', PSG, 'LW', ['RW'], 'R', 5, 4, 24, 183, [87, 86, 81, 82, 89, 40, 72], { fc25: 86, fc24: 85, fifa23: 75 }, { fc25: 'Napoli', fc24: 'Napoli', fifa23: 'Napoli' }, ['Trickster+', 'Technical', 'Finesse Shot', 'Flair']],
  ['raphinha', 'Raphinha', 'Raphael Dias Belloli', 'BRA', 'FC Barcelona', 'LW', ['RW'], 'L', 4, 3, 28, 176, [89, 90, 85, 84, 87, 55, 72], { fc25: 84, fc24: 85, fifa23: 84 }, {}, ['Finesse Shot+', 'Dead Ball', 'Rapid', 'Whipped Pass']],
  ['olise', 'Olise', 'Michael Olise', 'FRA', 'FC Bayern München', 'RW', ['CAM'], 'L', 4, 3, 23, 184, [86, 83, 80, 84, 88, 40, 62], { fc25: 83, fc24: 80, fifa23: 77 }, { fc24: 'Crystal Palace', fifa23: 'Crystal Palace' }, ['Trivela+', 'Incisive Pass', 'Technical']],
  ['gyokeres', 'Gyökeres', 'Viktor Gyökeres', 'SWE', 'Arsenal', 'ST', [], 'R', 3, 4, 27, 187, [86, 87, 86, 71, 80, 45, 87], { fc25: 84, fc24: 80, fifa23: 72 }, { fc25: 'Sporting CP', fc24: 'Sporting CP', fifa23: 'Coventry City' }, ['Bruiser+', 'Power Shot', 'Rapid', 'Relentless']],
  ['isak', 'Isak', 'Alexander Isak', 'SWE', 'Liverpool', 'ST', [], 'R', 4, 4, 26, 192, [87, 87, 86, 74, 86, 40, 77], { fc25: 86, fc24: 83, fifa23: 83 }, { fc25: 'Newcastle United', fc24: 'Newcastle United', fifa23: 'Real Sociedad' }, ['Finesse Shot+', 'Technical', 'Quick Step', 'Chip Shot']],
  ['modric', 'Modrić', 'Luka Modrić', 'CRO', 'AC Milan', 'CM', ['CAM'], 'R', 4, 4, 40, 172, [85, 70, 75, 88, 88, 71, 66], { fc25: 86, fc24: 87, fifa23: 88 }, { fc25: 'Real Madrid', fc24: 'Real Madrid', fifa23: 'Real Madrid' }, ['Trivela+', 'Tiki Taka+', 'Incisive Pass']],
  ['bastoni', 'Bastoni', 'Alessandro Bastoni', 'ITA', 'Inter', 'CB', ['LB'], 'L', 2, 3, 26, 190, [87, 78, 58, 77, 74, 86, 82], { fc25: 86, fc24: 86, fifa23: 84 }, {}, ['Long Ball Pass+', 'Anticipate', 'Aerial']],
  // Women
  ['bonmati', 'Bonmatí', 'Aitana Bonmatí', 'ESP', 'FC Barcelona Femení', 'CM', ['CAM'], 'R', 4, 4, 27, 161, [91, 81, 84, 89, 92, 64, 69], { fc25: 91, fc24: 90, fifa23: 87 }, {}, ['Technical+', 'Tiki Taka+', 'Incisive Pass', 'Press Proven'], 'W'],
  ['putellas', 'Putellas', 'Alexia Putellas', 'ESP', 'FC Barcelona Femení', 'CAM', ['CM'], 'L', 4, 4, 31, 173, [89, 75, 88, 89, 89, 51, 70], { fc25: 90, fc24: 91, fifa23: 92 }, {}, ['Finesse Shot+', 'Incisive Pass', 'Dead Ball'], 'W'],
  ['kerr', 'Kerr', 'Sam Kerr', 'AUS', 'Chelsea Women', 'ST', [], 'R', 3, 4, 32, 167, [87, 84, 88, 70, 84, 40, 78], { fc25: 88, fc24: 90, fifa23: 90 }, {}, ['Acrobatic+', 'Aerial', 'Power Header'], 'W'],
  ['russo', 'Russo', 'Alessia Russo', 'ENG', 'Arsenal Women', 'ST', [], 'R', 3, 4, 26, 173, [88, 80, 87, 76, 84, 40, 78], { fc25: 85, fc24: 85, fifa23: 83 }, { fifa23: 'Man United Women' }, ['Finesse Shot+', 'Aerial', 'Technical'], 'W'],
  ['ssmith', 'S. Smith', 'Sophia Smith', 'USA', 'Portland Thorns', 'ST', ['RW'], 'R', 4, 4, 25, 168, [88, 92, 85, 76, 88, 35, 72], { fc25: 88, fc24: 88, fifa23: 86 }, {}, ['Rapid+', 'Finesse Shot', 'Quick Step'], 'W'],
  ['hegerberg', 'Hegerberg', 'Ada Hegerberg', 'NOR', 'OL Lyonnes', 'ST', [], 'R', 3, 4, 30, 177, [87, 78, 89, 75, 82, 40, 79], { fc25: 88, fc24: 89, fifa23: 90 }, {}, ['Power Header+', 'Acrobatic', 'Power Shot'], 'W'],
  ['renard', 'Renard', 'Wendie Renard', 'FRA', 'OL Lyonnes', 'CB', [], 'R', 2, 3, 35, 187, [88, 60, 58, 68, 64, 90, 86], { fc25: 90, fc24: 91, fifa23: 91 }, {}, ['Aerial+', 'Block', 'Anticipate'], 'W'],
  // Icons
  ['ronaldinho', 'Ronaldinho', 'Ronaldo de Assis Moreira', 'BRA', 'ICON', 'CAM', ['LW'], 'R', 5, 4, 45, 182, [91, 91, 88, 90, 95, 37, 79], { fc25: 91, fc24: 91, fifa23: 91 }, {}, ['Trickster+', 'Flair+', 'Dead Ball', 'Incisive Pass'], 'I'],
  ['zidane', 'Zidane', 'Zinedine Zidane', 'FRA', 'ICON', 'CAM', ['CM'], 'R', 5, 4, 53, 185, [91, 78, 85, 91, 93, 65, 82], { fc25: 91, fc24: 91, fifa23: 91 }, {}, ['Technical+', 'Incisive Pass', 'Power Shot'], 'I'],
  ['r9', 'R9 Ronaldo', 'Ronaldo Luís Nazário de Lima', 'BRA', 'ICON', 'ST', [], 'R', 5, 4, 49, 183, [92, 95, 94, 81, 93, 45, 79], { fc25: 92, fc24: 92, fifa23: 92 }, {}, ['Finesse Shot+', 'Rapid+', 'Flair', 'Trickster'], 'I'],
  ['henry', 'Henry', 'Thierry Henry', 'FRA', 'ICON', 'ST', ['LW'], 'R', 4, 4, 48, 188, [91, 94, 91, 82, 90, 47, 77], { fc25: 91, fc24: 91, fifa23: 91 }, {}, ['Finesse Shot+', 'Rapid', 'Chip Shot'], 'I'],
  ['maldini', 'Maldini', 'Paolo Maldini', 'ITA', 'ICON', 'CB', ['LB'], 'R', 2, 4, 57, 186, [91, 85, 50, 72, 72, 93, 85], { fc25: 91, fc24: 91, fifa23: 91 }, {}, ['Anticipate+', 'Slide Tackle+', 'Jockey'], 'I'],
  ['gullit', 'Gullit', 'Ruud Gullit', 'NED', 'ICON', 'CAM', ['ST', 'CM'], 'R', 4, 4, 63, 191, [91, 88, 90, 86, 88, 80, 88], { fc25: 91, fc24: 91, fifa23: 91 }, {}, ['Power Shot+', 'Bruiser', 'Aerial', 'Relentless'], 'I'],
  ['buffon', 'Buffon', 'Gianluigi Buffon', 'ITA', 'ICON', 'GK', [], 'R', 1, 3, 47, 192, [90, 89, 87, 70, 91, 55, 90], { fc25: 90, fc24: 90, fifa23: 90 }, {}, ['Footwork+', 'Far Reach', 'Deflector'], 'I'],
];

const statsShift = (base, delta) => base.map((s) => clamp(Math.round(s + delta), 20, 99));

export const PLAYERS = RAW.map((r) => {
  const [id, name, fullName, nation, club, pos, altPos, foot, sm, wf, age, height, fc26, history, clubHistory, playstyles, kind = 'M'] = r;
  const [ovr26, ...stats26] = fc26;
  const versions = {};
  for (const g of GAMES) {
    const ovr = g.id === 'fc26' ? ovr26 : history[g.id];
    if (ovr == null) continue;
    const delta = ovr - ovr26;
    // Younger seasons: slightly more pace for veterans.
    const yearsBack = 2025 - g.year;
    const stats = statsShift(stats26, delta).map((s, i) =>
      i === 0 && kind !== 'I' && pos !== 'GK' && age > 29 ? clamp(s + yearsBack * 2, 20, 99) : s,
    );
    const c = kind === 'I' ? 'ICON' : clubHistory[g.id] || club;
    versions[g.id] = { ovr, stats, club: c, league: CLUBS[c]?.league || 'Other', age: age - yearsBack };
  }
  return {
    id, name, fullName, nation, pos, altPos, foot, sm, wf, height, playstyles, kind,
    isGK: pos === 'GK', isWomen: kind === 'W', isIcon: kind === 'I',
    versions,
  };
});

export const playerById = (id) => PLAYERS.find((p) => p.id === id);

// ---- Card generation (base cards + promo cards per game) ----------------------------

function boosted(stats, boost, r) {
  return stats.map((s) => clamp(s + boost + Math.round(r() * 2 - 0.5), 20, 99));
}

function cardsFor(player, gameId) {
  const v = player.versions[gameId];
  if (!v) return [];
  const make = (type, ovr, stats) => ({
    id: `${player.id}-${gameId}-${type}`,
    player, game: gameId, type, ovr: Math.min(99, ovr), stats,
    club: v.club, league: v.league, age: v.age,
  });
  const r = rng(hash(player.id + gameId));
  if (player.isIcon) {
    const t = CARD_TYPES.prime.boost;
    return [make('icon', v.ovr, v.stats), make('prime', v.ovr + t, boosted(v.stats, t, r))];
  }
  const cards = [make('gold', v.ovr, v.stats)];
  const add = (type, chance, cond = true) => {
    if (!cond || r() > chance) return;
    const b = CARD_TYPES[type].boost + (r() < 0.4 ? 1 : 0);
    cards.push(make(type, v.ovr + b, boosted(v.stats, b, r)));
  };
  add('otw', 0.2);
  add('totw', 0.55);
  add('fs', 0.7, v.age <= 23);
  add('toty', 0.6, v.ovr >= 89);
  add('tots', 0.45);
  return cards;
}

export const CARDS = PLAYERS.flatMap((p) => GAMES.flatMap((g) => cardsFor(p, g.id)));
export const cardById = (id) => CARDS.find((c) => c.id === id);
export const cardsForGame = (gameId) => CARDS.filter((c) => c.game === gameId);
export const cardsForPlayer = (playerId, gameId) =>
  CARDS.filter((c) => c.player.id === playerId && (!gameId || c.game === gameId));
export const baseCard = (playerId, gameId) =>
  cardsForPlayer(playerId, gameId).find((c) => c.type === 'gold' || c.type === 'icon');
