# Crypto Portfolio Tracker

An open-source web app for tracking the value of your cryptocurrency holdings.
Built with **React**, **Node.js/Express**, **MongoDB** and the **CoinGecko API**.

## Features

- **Multiple coins** – search any CoinGecko-listed coin, add amounts and an optional average buy price, edit or remove holdings. Adding a coin you already hold merges it with a weighted-average buy price.
- **Live valuation** – prices, 24h change, portfolio value and profit/loss refresh every 30 seconds (server-side cached to respect CoinGecko's rate limits).
- **Multi-currency** – USD, EUR, GBP, INR, JPY, AUD, CAD.
- **Charts** – portfolio value history (estimated from current holdings, or recorded snapshots), per-coin price charts (24H–1Y), allocation donut.
- **Analytics** – total/24h P&L, best & worst performers, concentration index (HHI), max drawdown, high/low for the chosen range.
- **Price alerts** – "notify me when X is above/below Y". A server cron job checks every minute; triggered alerts show up as in-app toasts (and browser notifications if allowed).
- **Wallet integration** – connect **MetaMask** (or paste any address as a watch-only wallet) to import ETH and common ERC-20 balances (USDT, USDC, DAI, LINK, UNI, WBTC). Read-only: no signatures, no keys.
- **Accounts** – email + password (bcrypt, JWT).

## Quick start

Requirements: Node.js 18+ and MongoDB (local, Atlas, or via Docker).

```bash
# 1. install everything
npm install                 # root (concurrently)
npm run install:all         # server + client

# 2. configure the API
cp server/.env.example server/.env
#   set JWT_SECRET (openssl rand -hex 32) and MONGO_URI

# 3. run API (http://localhost:5000) and web app (http://localhost:5173)
npm run dev
```

No local MongoDB? `docker run -d -p 27017:27017 mongo:7`.

### Docker (everything at once)

```bash
JWT_SECRET=$(openssl rand -hex 32) docker compose up --build
# open http://localhost:8080
```

### CoinGecko API key

The public API works without a key but is heavily rate-limited. For reliable use, create a free Demo key at coingecko.com and set `COINGECKO_API_KEY` in `server/.env`. For a Pro key, also set `COINGECKO_BASE_URL=https://pro-api.coingecko.com/api/v3` and `COINGECKO_KEY_HEADER=x-cg-pro-api-key`.

## Project structure

```
server/
  src/
    app.js, index.js          Express app, DB connection, cron jobs
    config.js                 Environment config
    models/                   User, Holding, Alert, Snapshot (Mongoose)
    routes/                   auth, holdings, coins, portfolio, alerts, wallet
    services/
      coingecko.js            API client: TTL cache, request de-dupe, stale-on-error
      portfolioService.js     Pure valuation / analytics / history math
      alertService.js         Cron alert evaluation (rule in alertRules.js)
      snapshotService.js      Portfolio value snapshots for history
      walletService.js        On-chain balance reads via ethers
    data/chains.js            Supported chain + token list (easy to extend)
  test/                       node:test unit + API tests
client/
  src/
    App.jsx                   Shell, tabs, polling, toasts
    components/               Dashboard widgets, tables, modals, MetaMask panel
    api.js, usePolling.js     API client and live-refresh hook
```

## API reference

All routes except `/api/health` and `/api/auth/register|login` need `Authorization: Bearer <token>`.

| Method | Route | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | `{ email, password, name? }` → `{ token, user }` |
| POST | `/api/auth/login` | `{ email, password }` → `{ token, user }` |
| GET / PATCH | `/api/auth/me` | Profile; PATCH `{ name?, currency? }` |
| GET | `/api/portfolio` | Valued holdings, totals, allocation, analytics |
| GET | `/api/portfolio/history?days=30` | `{ snapshots, estimated, stats }` |
| GET / POST | `/api/holdings` | List / add `{ coinId, amount, buyPrice?, notes? }` |
| PUT / DELETE | `/api/holdings/:id` | Update / remove |
| GET | `/api/coins/search?q=` | Search coins |
| GET | `/api/coins/top?limit=` | Top coins by market cap |
| GET | `/api/coins/:id/chart?days=` | Price history |
| GET / POST | `/api/alerts` | List / create `{ coinId, condition: above\|below, targetPrice }` |
| PATCH | `/api/alerts/:id/reactivate` | Re-arm a triggered alert |
| POST | `/api/alerts/ack` | Mark triggered alerts as seen |
| DELETE | `/api/alerts/:id` | Delete |
| GET | `/api/wallet` | Connected wallets |
| POST | `/api/wallet/import` | `{ address, label? }` – read balances & upsert holdings |
| DELETE | `/api/wallet/:address` | Remove wallet and its imported holdings |

## Tests

```bash
npm test      # runs server/test with node:test
```

`portfolio.test.js` covers the valuation/analytics maths and alert rule with no external services. `api.test.js` boots the Express app and checks auth guards and validation (it does not need MongoDB).

## Design notes & limits

- **Historical value is an estimate by default.** The "Estimated" series prices your *current* holdings at past prices (assumes you held them throughout). "Recorded" shows real snapshots, saved on page loads (at most every 15 min) and hourly by the server.
- **Cost basis is in your selected currency.** If you change currency, buy prices are not converted.
- **Free-tier rate limits.** The estimate fetches charts for your 8 largest holdings; results are cached for 5 minutes.
- **Wallet import** covers Ethereum mainnet only for now (ETH + a short list of tokens in `server/src/data/chains.js`).
- **Not financial advice.** Prices come from a third party and may be delayed or wrong.

## Roadmap / good first issues

- More chains (Polygon, Arbitrum, BSC, Solana) and token auto-discovery
- Transaction history & FIFO/average cost-basis accounting
- Email / Telegram / webhook alert delivery
- CSV import/export; exchange API imports (read-only keys)
- Percentage-change and portfolio-level alerts
- Dark/light theme toggle, i18n
- Server-Sent Events instead of polling

See [CONTRIBUTING.md](CONTRIBUTING.md). MIT licensed.
