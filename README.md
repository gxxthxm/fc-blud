# FC Hub — EA FC & FIFA companion

A FUTBIN-style companion web app for EA SPORTS FC and FIFA. It's plain HTML, CSS and ES modules, with no build step and no dependencies.

## Features

- **Player database**: every base and promo card for FIFA 23 → FC 26. You can filter by position, league, nation, card type, rating, skill moves and weak foot, and sort by price, 24h change or any face stat.
- **Player pages**: FUT card, detailed stats, PlayStyles, a price chart (24h / 7d / 30d), other versions of the card, ratings across games, and similar players.
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

The bundled data is **demo data**:

| What | File | Replace with |
| --- | --- | --- |
| Players & ratings (approximate, not official) | `js/data/players.js` | Your player DB / API |
| Prices (simulated random walk) | `js/data/market.js` → `priceHistory()` | A live price feed |
| News & rumors (placeholders) | `js/data/news.js` → `getNews()` | Your news API / RSS proxy |
| Game features | `js/data/features.js` | — |

To add a new game (e.g. FC 27), add it to `GAMES` in `js/data/meta.js`, add the ratings to `players.js`, and add its features to `features.js`.

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
