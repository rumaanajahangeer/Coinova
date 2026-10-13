# Contributing

Thanks for helping! Bug reports, features, docs and tests are all welcome.

## Workflow

1. Fork and clone, then `npm install && npm run install:all`.
2. Copy `server/.env.example` to `server/.env` and start MongoDB.
3. Create a branch: `git checkout -b feat/my-change`.
4. Make changes, add tests where logic is involved, run `npm test`.
5. Open a pull request describing *what* and *why*. Keep PRs focused.

## Code guidelines

- Server is ESM (`import`/`export`). Validate all request input with `zod`.
- Keep business logic in `services/` as pure functions where possible (see `portfolioService.js`) so it can be unit-tested without a database.
- Never log or store private keys / seed phrases. Wallet features must stay read-only.
- Respect CoinGecko limits: go through `services/coingecko.js` (cached) instead of calling the API directly.

## Common contributions

### Support a new token in wallet import
Add an entry to `tokens` in `server/src/data/chains.js`:

```js
{ symbol: 'AAVE', name: 'Aave', coinId: 'aave', address: '0x…', decimals: 18 }
```
`coinId` must be the CoinGecko id (see `https://api.coingecko.com/api/v3/coins/list`). Verify the contract address and decimals on a block explorer.

### Adding a chain
1. Add a chain object to `data/chains.js` (native asset + tokens) and include it in `CHAINS`.
2. Make `walletService.fetchWalletBalances` take the chain's RPC URL (add an env var such as `POLYGON_RPC_URL`).
3. Loop over `CHAINS` in `routes/wallet.js` and merge the results.

### New analytics
Add pure functions to `server/src/services/portfolioService.js` with tests in `server/test/portfolio.test.js`, expose them through `routes/portfolio.js`, and render them in `client/src/components/`.

### New wallet integration (WalletConnect, Coinbase Wallet, …)
Wallet connection happens client-side in `client/src/components/WalletPanel.jsx`; the server only needs an address. Add a connector there and reuse `POST /api/wallet/import`.

## Reporting security issues
Please do not open a public issue for vulnerabilities; contact the maintainers privately.
