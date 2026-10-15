// News, rumors and leaks feed.
//
// DEMO CONTENT: these items are placeholders (player IDs refer to players.csv) that show how the feed works. Plug in a real
// source (your own API, an RSS proxy, etc.) by replacing `getNews()`.

const H = 3.6e6;
const ITEMS = [
  {
    id: 'n1', kind: 'promo', hoursAgo: 2, title: 'Team of the Week predictions: who makes the cut?',
    body: 'Community predictions for the next Team of the Week lineup based on weekend performances. Strikers with hat-tricks and clean-sheet keepers lead the shortlist.',
    players: ['241651', '202126', '243715'], confidence: 65, query: 'team of the week predictions FC 27',
  },
  {
    id: 'n2', kind: 'rumor', hoursAgo: 6, title: 'Rumored: Future Stars-style promo for young talents',
    body: 'Several content creators hint at an upcoming promo focused on players aged 23 and under. Treat as speculation until confirmed by the official loading screen.',
    players: ['277643', '247827', '256790', '256630'], confidence: 55, query: 'FC 27 future stars predictions',
  },
  {
    id: 'n3', kind: 'leak', hoursAgo: 11, title: 'Datamine hints at new Icon SBC in the coming weeks',
    body: 'Strings in a recent web app update reference a new Icon challenge. Leaks like this are often accurate on players but not always on timing.',
    players: [], confidence: 40, query: 'FC 27 icon SBC leak',
  },
  {
    id: 'n4', kind: 'update', hoursAgo: 20, title: 'Title Update: finesse shots and keeper positioning tweaked',
    body: 'Patch notes list adjustments to finesse shot accuracy from outside the box and improved goalkeeper positioning on near-post shots.',
    players: ['209331', '246669', '192119'], confidence: null, query: 'FC 27 title update patch notes',
  },
  {
    id: 'n5', kind: 'market', hoursAgo: 26, title: 'Market dips ahead of weekend promo',
    body: 'Prices of meta attackers fell across the board as traders sold ahead of new content. Historically prices recover 24–48 hours after a promo drop.',
    players: ['231747', '238794', '231443'], confidence: null, query: 'FC 27 trading tips market crash',
  },
  {
    id: 'n6', kind: 'rumor', hoursAgo: 34, title: 'In-form upgrade expected for Liverpool’s summer signings',
    body: 'Strong recent performances have the community expecting dynamic upgrades for Liverpool’s attacking signings.',
    players: ['256630', '233731'], confidence: 45, query: 'Wirtz Isak FC 27 upgrade',
  },
  {
    id: 'n7', kind: 'news', hoursAgo: 48, title: 'New Evolution path for pace-focused wingers',
    body: 'A new Evolution targets wingers under a set rating cap, adding pace, dribbling and a PlayStyle+ slot.',
    players: ['241721', '247635', '233419'], confidence: null, query: 'FC 27 best winger evolution',
  },
  {
    id: 'n8', kind: 'news', hoursAgo: 60, title: 'Rush weekend tournament returns with boosted rewards',
    body: 'The 5v5 Rush tournament is back this weekend with extra packs for players who reach the final round.',
    players: [], confidence: null, query: 'FC 27 rush tips', feature: 'fc25/rush',
  },
  {
    id: 'n9', kind: 'leak', hoursAgo: 74, title: 'Women’s Team of the Season shortlist leaked?',
    body: 'An unverified list of Liga F and WSL nominees is circulating. Treat with caution.',
    players: ['241667', '227203', '258980'], confidence: 30, query: 'FC 27 women team of the season',
  },
  {
    id: 'n10', kind: 'promo', hoursAgo: 96, title: 'Ones to Watch: cards that upgrade with real transfers',
    body: 'Ones to Watch cards receive upgrades when their club wins. Here are the community’s favourite picks.',
    players: ['241651', '192985', '230621'], confidence: null, query: 'ones to watch best cards FC 27',
  },
];

export const NEWS_KINDS = {
  news: { label: 'News', cls: 'k-news' },
  rumor: { label: 'Rumor', cls: 'k-rumor' },
  leak: { label: 'Leak', cls: 'k-leak' },
  promo: { label: 'Promo', cls: 'k-promo' },
  update: { label: 'Update', cls: 'k-update' },
  market: { label: 'Market', cls: 'k-market' },
};

export function getNews() {
  const now = Date.now();
  return ITEMS.map((i) => ({ ...i, date: new Date(now - i.hoursAgo * H) }));
}
