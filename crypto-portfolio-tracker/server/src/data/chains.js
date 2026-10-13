/**
 * Chains supported for wallet import.
 *
 * To add a token on an existing chain, append it to `tokens`:
 *   { symbol, name, coinId (CoinGecko id), address, decimals }
 *
 * To add a new chain, add an entry here and make `walletService` pick the RPC URL
 * for it (see CONTRIBUTING.md -> "Adding a chain").
 */
export const ETHEREUM = {
  id: 'ethereum',
  chainId: 1,
  name: 'Ethereum Mainnet',
  native: { symbol: 'ETH', name: 'Ethereum', coinId: 'ethereum', decimals: 18 },
  tokens: [
    { symbol: 'USDT', name: 'Tether', coinId: 'tether', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
    { symbol: 'USDC', name: 'USD Coin', coinId: 'usd-coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
    { symbol: 'DAI', name: 'Dai', coinId: 'dai', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
    { symbol: 'LINK', name: 'Chainlink', coinId: 'chainlink', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', decimals: 18 },
    { symbol: 'UNI', name: 'Uniswap', coinId: 'uniswap', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18 },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', coinId: 'wrapped-bitcoin', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8 },
  ],
};

export const CHAINS = [ETHEREUM];
