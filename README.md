# FC Hub — EA FC & FIFA companion

A FUTBIN-style companion web app for EA SPORTS FC and FIFA. It's plain HTML, CSS and ES modules, with no build step and no dependencies.

## Features

- **Player database**: all 19,789 FC 27 players from `players.csv`. You can filter by position, league, club, nation, card tier, rating, skill moves, weak foot and PlayStyle, and sort by price, 24h change, age or any face stat.
- **Player pages**: FUT card, all detailed attributes, PlayStyles, a price chart (24h / 7d / 30d), best attributes, ratings across editions (when the CSV has several), and similar players.
- **Transfer market**: market index, risers and fallers, most expensive cards, best-value cards, a league heatmap, a watchlist and trading tips.
- **News, rumors & leaks**: a feed with a community-confidence meter and the players each story mentions.
- **Game features**: what's new in each edition (Rush, FC IQ, PlayStyles, Evolutions, …).
- **Squad builder**: four formations, FUT chemistry (FIFA 23+ model), team rating and squad value.
- **Compare**: radar chart and a head-to-head table.
- **Video recommendations**: picking a player, feature, comparison, news story or the market builds a ranked list of video topics. Add a YouTube Data API v3 key in **Settings** to watch the videos inside the app. Without a key, each topic opens a YouTube search.

## Run locally

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173. Any static file server works. The app needs a server because browsers block ES modules over `file://`.

## Data

Players are loaded at startup from **`players.csv`** (19,789 players, FC 27, men and women).

- One row = one player in one edition (`edition` column, e.g. `fc27`). Add rows for other editions, or more files to `DATA_FILES` in `js/data/players.js`, and the game selector picks them up.
- Required columns: `player_id, overall_rating, position, club, league, nationality, pace, shooting, passing, dribbling, defending, physicality`. Everything else (names, alt positions, foot, skills, weak foot, PlayStyles, detailed attributes, birthdate) is used when present.
- For goalkeepers, the six face-stat columns hold DIV / HAN / KIC / REF / SPD / POS.
- Cards are Gold (75+), Silver (65–74) or Bronze (≤64).

The rest is still demo data:

| What | File | Replace with |
| --- | --- | --- |
| Prices (simulated; the CSV has none) | `js/data/market.js` → `priceInfo()` / `priceHistory()` | A live price feed |
| News & rumors (placeholders) | `js/data/news.js` → `getNews()` | Your news API / RSS proxy |
| Game features | `js/data/features.js` | — |

**Player images:** portraits are hotlinked from EA's FUT Web App by `player_id`, via `PLAYER_IMAGES` in `js/data/meta.js` (one URL template per edition). EA changes the path each year; the comment there explains how to find the new one. Cards fall back to initials if an image fails to load. These are EA's assets, so they're for personal use only.

## Structure

```
index.html
css/styles.css
js/app.js            router + header
js/state.js          persisted state (game, platform, watchlist, squads, API key)
js/data/             meta, players/cards, market, news, features
js/components/       FUT card, SVG charts
js/lib/videos.js     video recommendation engine
js/views/            one module per page
```

FC Hub is an unofficial fan project. It is not affiliated with EA SPORTS or FIFA.
