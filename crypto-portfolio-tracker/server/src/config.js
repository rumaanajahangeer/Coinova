import 'dotenv/config';

const isProd = process.env.NODE_ENV === 'production';

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crypto-tracker',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpires: process.env.JWT_EXPIRES || '7d',
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  coingecko: {
    baseUrl: process.env.COINGECKO_BASE_URL || 'https://api.coingecko.com/api/v3',
    apiKey: process.env.COINGECKO_API_KEY || '',
    keyHeader: process.env.COINGECKO_KEY_HEADER || 'x-cg-demo-api-key',
    priceTtlMs: 30_000,
    searchTtlMs: 5 * 60_000,
    chartTtlMs: 5 * 60_000,
  },
  ethRpcUrl: process.env.ETH_RPC_URL || 'https://ethereum-rpc.publicnode.com',
  alertCron: process.env.ALERT_CRON || '* * * * *',
  snapshotCron: process.env.SNAPSHOT_CRON || '0 * * * *',
  snapshotMinGapMs: 15 * 60_000,
};

if (isProd && config.jwtSecret === 'dev-secret-change-me') {
  throw new Error('JWT_SECRET must be set in production');
}
