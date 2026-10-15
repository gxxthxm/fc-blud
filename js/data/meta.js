// Reference data: games, nations, clubs/leagues, card types and position groups.

export const GAMES = [
  { id: 'fc26', name: 'EA SPORTS FC 26', short: 'FC 26', year: 2025, current: true },
  { id: 'fc25', name: 'EA SPORTS FC 25', short: 'FC 25', year: 2024 },
  { id: 'fc24', name: 'EA SPORTS FC 24', short: 'FC 24', year: 2023 },
  { id: 'fifa23', name: 'FIFA 23', short: 'FIFA 23', year: 2022 },
];
export const CURRENT_GAME = GAMES.find((g) => g.current).id;
export const gameById = (id) => GAMES.find((g) => g.id === id) || GAMES[0];

const flagFromIso = (iso) =>
  iso.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));

const SUBDIVISION_FLAGS = {
  ENG: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}',
};

const NATION_LIST = [
  ['FRA', 'France', 'FR'], ['NOR', 'Norway', 'NO'], ['EGY', 'Egypt', 'EG'], ['ENG', 'England', null],
  ['NED', 'Netherlands', 'NL'], ['ESP', 'Spain', 'ES'], ['BRA', 'Brazil', 'BR'], ['POR', 'Portugal', 'PT'],
  ['MAR', 'Morocco', 'MA'], ['ITA', 'Italy', 'IT'], ['BEL', 'Belgium', 'BE'], ['GER', 'Germany', 'DE'],
  ['ARG', 'Argentina', 'AR'], ['KOR', 'Korea Republic', 'KR'], ['GEO', 'Georgia', 'GE'], ['SWE', 'Sweden', 'SE'],
  ['CRO', 'Croatia', 'HR'], ['AUS', 'Australia', 'AU'], ['USA', 'United States', 'US'], ['RUS', 'Russia', 'RU'],
];
export const NATIONS = Object.fromEntries(
  NATION_LIST.map(([code, name, iso]) => [code, { code, name, flag: iso ? flagFromIso(iso) : SUBDIVISION_FLAGS[code] }]),
);

export const CLUBS = {
  'Real Madrid': { league: 'LALIGA', short: 'RMA' },
  'FC Barcelona': { league: 'LALIGA', short: 'BAR' },
  'Atlético de Madrid': { league: 'LALIGA', short: 'ATM' },
  'Real Sociedad': { league: 'LALIGA', short: 'RSO' },
  'Manchester City': { league: 'Premier League', short: 'MCI' },
  Liverpool: { league: 'Premier League', short: 'LIV' },
  Arsenal: { league: 'Premier League', short: 'ARS' },
  'Tottenham Hotspur': { league: 'Premier League', short: 'TOT' },
  'Newcastle United': { league: 'Premier League', short: 'NEW' },
  'West Ham United': { league: 'Premier League', short: 'WHU' },
  'Crystal Palace': { league: 'Premier League', short: 'CRY' },
  'Manchester United': { league: 'Premier League', short: 'MUN' },
  'FC Bayern München': { league: 'Bundesliga', short: 'FCB' },
  'Borussia Dortmund': { league: 'Bundesliga', short: 'BVB' },
  'Bayer 04 Leverkusen': { league: 'Bundesliga', short: 'B04' },
  'Paris Saint-Germain': { league: 'Ligue 1', short: 'PSG' },
  Inter: { league: 'Serie A', short: 'INT' },
  'AC Milan': { league: 'Serie A', short: 'MIL' },
  Napoli: { league: 'Serie A', short: 'NAP' },
  'Inter Miami CF': { league: 'MLS', short: 'MIA' },
  LAFC: { league: 'MLS', short: 'LAFC' },
  'Al Nassr': { league: 'Saudi Pro League', short: 'NSR' },
  'Sporting CP': { league: 'Liga Portugal', short: 'SCP' },
  'Coventry City': { league: 'Championship', short: 'COV' },
  'FC Barcelona Femení': { league: 'Liga F', short: 'BAR' },
  'Chelsea Women': { league: 'WSL', short: 'CHE' },
  'Arsenal Women': { league: 'WSL', short: 'ARS' },
  'Man United Women': { league: 'WSL', short: 'MUN' },
  'Portland Thorns': { league: 'NWSL', short: 'POR' },
  'OL Lyonnes': { league: 'Première Ligue', short: 'OL' },
  ICON: { league: 'Icons', short: 'ICON' },
};

export const LEAGUES = [...new Set(Object.values(CLUBS).map((c) => c.league))].sort();

export const CARD_TYPES = {
  gold: { label: 'Gold', short: 'GOLD', cls: 'ct-gold' },
  otw: { label: 'Ones to Watch', short: 'OTW', cls: 'ct-otw', boost: 1 },
  totw: { label: 'Team of the Week', short: 'TOTW', cls: 'ct-totw', boost: 2 },
  fs: { label: 'Future Stars', short: 'FS', cls: 'ct-fs', boost: 4 },
  tots: { label: 'Team of the Season', short: 'TOTS', cls: 'ct-tots', boost: 5 },
  toty: { label: 'Team of the Year', short: 'TOTY', cls: 'ct-toty', boost: 7 },
  icon: { label: 'Icon', short: 'ICON', cls: 'ct-icon' },
  prime: { label: 'Prime Icon', short: 'PRIME', cls: 'ct-prime', boost: 3 },
};

export const POSITION_GROUPS = {
  GK: ['GK'],
  DEF: ['CB', 'LB', 'RB', 'LWB', 'RWB'],
  MID: ['CDM', 'CM', 'CAM', 'LM', 'RM'],
  ATT: ['ST', 'CF', 'LW', 'RW'],
};
export const groupOf = (pos) => Object.keys(POSITION_GROUPS).find((g) => POSITION_GROUPS[g].includes(pos));

export const STAT_LABELS = ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'];
export const GK_STAT_LABELS = ['DIV', 'HAN', 'KIC', 'REF', 'SPD', 'POS'];

// Detailed in-game attributes grouped under each face stat (outfield players).
export const SUB_STATS = [
  ['Acceleration', 'Sprint Speed'],
  ['Positioning', 'Finishing', 'Shot Power', 'Long Shots', 'Volleys', 'Penalties'],
  ['Vision', 'Crossing', 'FK Accuracy', 'Short Passing', 'Long Passing', 'Curve'],
  ['Agility', 'Balance', 'Reactions', 'Ball Control', 'Dribbling', 'Composure'],
  ['Interceptions', 'Heading Acc.', 'Def. Awareness', 'Standing Tackle', 'Sliding Tackle'],
  ['Jumping', 'Stamina', 'Strength', 'Aggression'],
];
