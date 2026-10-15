// Reference data: games, nations, clubs, card types, attribute groups.

// Known editions. Any other `edition` value found in the CSV gets a generated entry.
export const GAMES = [
  { id: 'fc27', name: 'EA SPORTS FC 27', short: 'FC 27', year: 2026 },
  { id: 'fc26', name: 'EA SPORTS FC 26', short: 'FC 26', year: 2025 },
  { id: 'fc25', name: 'EA SPORTS FC 25', short: 'FC 25', year: 2024 },
  { id: 'fc24', name: 'EA SPORTS FC 24', short: 'FC 24', year: 2023 },
  { id: 'fifa23', name: 'FIFA 23', short: 'FIFA 23', year: 2022 },
];
export const gameById = (id) =>
  GAMES.find((g) => g.id === id) || { id, name: String(id).toUpperCase(), short: String(id).toUpperCase(), year: 0 };

// Editions present in the loaded data, newest first. Set by the data loader.
export let LOADED_GAMES = [];
export let CURRENT_GAME = GAMES[0].id;
export function setLoadedGames(ids) {
  const order = (id) => {
    const i = GAMES.findIndex((g) => g.id === id);
    return i < 0 ? -1 : i;
  };
  LOADED_GAMES = [...ids].sort((a, b) => order(a) - order(b));
  CURRENT_GAME = LOADED_GAMES[0];
}

// Optional player image source, keyed by the CSV's player_id. Use a source you have the
// rights to, e.g. 'https://images.example.com/players/{id}.png'. null = initials only.
export const PLAYER_IMAGE_URL = null;

// ---- Nations (names as they appear in the CSV) -----------------------------------------

const ISO = `Afghanistan:AF|Albania:AL|Algeria:DZ|Andorra:AD|Angola:AO|Antigua and Barbuda:AG|Argentina:AR|Armenia:AM|Australia:AU|Austria:AT|Azerbaijan:AZ|Bangladesh:BD|Barbados:BB|Belarus:BY|Belgium:BE|Benin:BJ|Bermuda:BM|Bolivia:BO|Bosnia and Herzegovina:BA|Brazil:BR|Bulgaria:BG|Burkina Faso:BF|Burundi:BI|Cameroon:CM|Canada:CA|Cape Verde Islands:CV|Central African Republic:CF|Chad:TD|Chile:CL|China PR:CN|Chinese Taipei:TW|Colombia:CO|Comoros:KM|Congo:CG|Congo DR:CD|Costa Rica:CR|Croatia:HR|Cuba:CU|Curaçao:CW|Cyprus:CY|Czech Republic:CZ|Côte d'Ivoire:CI|Denmark:DK|Dominican Republic:DO|Ecuador:EC|Egypt:EG|El Salvador:SV|Equatorial Guinea:GQ|Eritrea:ER|Estonia:EE|Faroe Islands:FO|Finland:FI|France:FR|Gabon:GA|Gambia:GM|Georgia:GE|Germany:DE|Ghana:GH|Gibraltar:GI|Greece:GR|Grenada:GD|Guatemala:GT|Guinea:GN|Guinea-Bissau:GW|Guyana:GY|Haiti:HT|Holland:NL|Netherlands:NL|Honduras:HN|Hong Kong:HK|Hungary:HU|Iceland:IS|India:IN|Indonesia:ID|Iran:IR|Iraq:IQ|Israel:IL|Italy:IT|Jamaica:JM|Japan:JP|Jordan:JO|Kazakhstan:KZ|Kenya:KE|Korea DPR:KP|Korea Republic:KR|Kosovo:XK|Latvia:LV|Lebanon:LB|Liberia:LR|Libya:LY|Liechtenstein:LI|Lithuania:LT|Luxembourg:LU|Madagascar:MG|Malawi:MW|Mali:ML|Malta:MT|Mauritania:MR|Mauritius:MU|Mexico:MX|Moldova:MD|Montenegro:ME|Montserrat:MS|Morocco:MA|Mozambique:MZ|Namibia:NA|New Caledonia:NC|New Zealand:NZ|Niger:NE|Nigeria:NG|North Macedonia:MK|Northern Ireland:GB|Norway:NO|Oman:OM|Pakistan:PK|Palestine:PS|Panama:PA|Paraguay:PY|Peru:PE|Philippines:PH|Poland:PL|Portugal:PT|Puerto Rico:PR|Qatar:QA|Republic of Ireland:IE|Romania:RO|Russia:RU|Rwanda:RW|Saudi Arabia:SA|Senegal:SN|Serbia:RS|Sierra Leone:SL|Slovakia:SK|Slovenia:SI|Somalia:SO|South Africa:ZA|Spain:ES|Sri Lanka:LK|St. Kitts and Nevis:KN|St. Lucia:LC|Suriname:SR|Sweden:SE|Switzerland:CH|Syria:SY|São Tomé e Príncipe:ST|Tanzania:TZ|Thailand:TH|Togo:TG|Trinidad and Tobago:TT|Tunisia:TN|Turkey:TR|Uganda:UG|Ukraine:UA|United Arab Emirates:AE|United States:US|Uruguay:UY|Uzbekistan:UZ|Vanuatu:VU|Venezuela:VE|Yemen:YE|Zambia:ZM|Zimbabwe:ZW`;

const flagFromIso = (iso) => iso.replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
const tagFlag = (code) =>
  '\u{1F3F4}' + [...code].map((c) => String.fromCodePoint(0xe0000 + c.charCodeAt(0))).join('') + '\u{E007F}';

const FLAGS = Object.fromEntries(ISO.split('|').map((pair) => {
  const [name, iso] = pair.split(':');
  return [name, flagFromIso(iso)];
}));
FLAGS.England = tagFlag('gbeng');
FLAGS.Scotland = tagFlag('gbsct');
FLAGS.Wales = tagFlag('gbwls');

export const nationOf = (name) => ({ name, flag: FLAGS[name] || '' });

// ---- Clubs ------------------------------------------------------------------------------

const CLUB_NOISE = /^(FC|CF|AFC|SC|AC|SSC|FK|SK|CD|CA|SV|VfB|VfL|RC|RCD|UD|SD|AS|OGC|US|1\.)$/i;
const shortCache = new Map();
// Three-letter crest code derived from the club name ("Paris SG" → PSG, "Arsenal" → ARS).
export function clubShort(name) {
  if (shortCache.has(name)) return shortCache.get(name);
  const words = name.split(/\s+/).filter((w) => !CLUB_NOISE.test(w));
  let s;
  if (!words.length) s = name.slice(0, 3);
  else if (words.length === 1) s = words[0].slice(0, 3);
  else if (/^[A-Z]{2,3}$/.test(words[1])) s = words[0][0] + words[1];
  else s = words.slice(0, 3).map((w) => w[0]).join('');
  s = s.toUpperCase();
  shortCache.set(name, s);
  return s;
}

// ---- Cards ------------------------------------------------------------------------------

export const CARD_TYPES = {
  gold: { label: 'Gold', short: 'GOLD', cls: 'ct-gold' },
  silver: { label: 'Silver', short: 'SILVER', cls: 'ct-silver' },
  bronze: { label: 'Bronze', short: 'BRONZE', cls: 'ct-bronze' },
};
export const typeForRating = (ovr) => (ovr >= 75 ? 'gold' : ovr >= 65 ? 'silver' : 'bronze');

export const POSITION_GROUPS = {
  GK: ['GK'],
  DEF: ['CB', 'LB', 'RB', 'LWB', 'RWB'],
  MID: ['CDM', 'CM', 'CAM', 'LM', 'RM'],
  ATT: ['ST', 'CF', 'LW', 'RW'],
};
export const groupOf = (pos) => Object.keys(POSITION_GROUPS).find((g) => POSITION_GROUPS[g].includes(pos));

// Face stats. For goalkeepers the CSV stores DIV/HAN/KIC/REF/SPD/POS in the same columns.
export const FACE_COLUMNS = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physicality'];
export const STAT_LABELS = ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'];
export const GK_STAT_LABELS = ['DIV', 'HAN', 'KIC', 'REF', 'SPD', 'POS'];

// Detailed attributes under each face stat: [label, CSV column].
export const SUB_STATS = [
  [['Acceleration', 'movement_acceleration'], ['Sprint Speed', 'movement_sprint_speed']],
  [['Positioning', 'mentality_positioning'], ['Finishing', 'attacking_finishing'], ['Shot Power', 'power_shot_power'],
    ['Long Shots', 'power_long_shots'], ['Volleys', 'attacking_volleys'], ['Penalties', 'mentality_penalties']],
  [['Vision', 'mentality_vision'], ['Crossing', 'attacking_crossing'], ['FK Accuracy', 'skill_fk_accuracy'],
    ['Short Passing', 'attacking_short_passing'], ['Long Passing', 'skill_long_passing'], ['Curve', 'skill_curve']],
  [['Agility', 'movement_agility'], ['Balance', 'movement_balance'], ['Reactions', 'movement_reactions'],
    ['Ball Control', 'skill_ball_control'], ['Dribbling', 'skill_dribbling'], ['Composure', 'mentality_composure']],
  [['Interceptions', 'mentality_interceptions'], ['Heading Acc.', 'attacking_heading_accuracy'],
    ['Def. Awareness', 'defending_awareness'], ['Standing Tackle', 'defending_standing_tackle'], ['Sliding Tackle', 'defending_sliding_tackle']],
  [['Jumping', 'power_jumping'], ['Stamina', 'power_stamina'], ['Strength', 'power_strength'], ['Aggression', 'mentality_aggression']],
];
export const GK_SUB_STATS = [
  [['Diving', 'goalkeeping_diving']],
  [['Handling', 'goalkeeping_handling']],
  [['Kicking', 'goalkeeping_kicking']],
  [['Reflexes', 'goalkeeping_reflexes']],
  [['Acceleration', 'movement_acceleration'], ['Sprint Speed', 'movement_sprint_speed']],
  [['Positioning', 'goalkeeping_positioning']],
];
export const ATTRIBUTE_COLUMNS = [...new Set([...SUB_STATS, ...GK_SUB_STATS].flat().map(([, col]) => col))];
