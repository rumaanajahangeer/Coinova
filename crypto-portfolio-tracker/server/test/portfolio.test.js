import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildEstimatedHistory,
  computePortfolio,
  seriesStats,
} from '../src/services/portfolioService.js';
import { isTriggered } from '../src/services/alertRules.js';

const market = {
  bitcoin: { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', image: 'b.png', price: 60000, change24h: 10 },
  ethereum: { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', image: 'e.png', price: 3000, change24h: -5 },
};

const holdings = [
  { _id: 'a', coinId: 'bitcoin', amount: 0.5, buyPrice: 40000, source: 'manual' },
  { _id: 'b', coinId: 'ethereum', amount: 10, buyPrice: null, source: 'manual' },
  { _id: 'c', coinId: 'ethereum', amount: 2, buyPrice: null, source: 'wallet', walletAddress: '0x1' },
];

test('computePortfolio values holdings and computes P/L', () => {
  const p = computePortfolio(holdings, market);
  assert.equal(p.totals.value, 30000 + 30000 + 6000);
  assert.equal(p.totals.costBasis, 20000); // only BTC has a cost basis
  assert.equal(p.totals.pnl, 10000);
  assert.equal(p.totals.pnlPct, 50);
  assert.equal(p.holdings[0].pnlPct, 50);
  assert.equal(p.holdings[1].pnl, null);
});

test('allocation aggregates the same coin across sources', () => {
  const p = computePortfolio(holdings, market);
  const eth = p.allocation.find((a) => a.coinId === 'ethereum');
  assert.equal(eth.value, 36000);
  assert.equal(p.allocation.length, 2);
  const total = p.allocation.reduce((a, x) => a + x.pct, 0);
  assert.ok(Math.abs(total - 100) < 1e-9);
});

test('24h change is derived from per-coin percentages', () => {
  const p = computePortfolio([holdings[0]], market);
  // 30000 now, +10% => was 27272.72..., change 2727.27...
  assert.ok(Math.abs(p.totals.change24hValue - (30000 - 30000 / 1.1)) < 1e-6);
});

test('missing prices are flagged and do not break totals', () => {
  const p = computePortfolio(
    [{ _id: 'x', coinId: 'unknown', amount: 5, buyPrice: 1, source: 'manual' }],
    {}
  );
  assert.equal(p.totals.value, 0);
  assert.equal(p.holdings[0].priceMissing, true);
  assert.equal(p.totals.pnl, null);
});

test('empty portfolio is handled', () => {
  const p = computePortfolio([], {});
  assert.equal(p.totals.value, 0);
  assert.equal(p.analytics.diversification, 'n/a');
});

test('analytics picks best/worst performers and concentration', () => {
  const p = computePortfolio(
    [
      { _id: 'a', coinId: 'bitcoin', amount: 1, buyPrice: 30000, source: 'manual' },
      { _id: 'b', coinId: 'ethereum', amount: 1, buyPrice: 6000, source: 'manual' },
    ],
    market
  );
  assert.equal(p.analytics.bestPerformer.symbol, 'BTC');
  assert.equal(p.analytics.worstPerformer.symbol, 'ETH');
  assert.equal(p.analytics.bestToday.symbol, 'BTC');
  assert.equal(p.analytics.diversification, 'concentrated');
});

test('seriesStats computes change and max drawdown', () => {
  const s = seriesStats([100, 150, 90, 120].map((value, t) => ({ t, value })));
  assert.equal(s.change, 20);
  assert.equal(s.high, 150);
  assert.equal(s.low, 90);
  assert.equal(s.maxDrawdownPct, 40);
  assert.equal(seriesStats([{ t: 0, value: 1 }]), null);
});

test('buildEstimatedHistory sums amount * price on aligned timestamps', () => {
  const charts = {
    bitcoin: [[1, 100], [2, 200], [3, 300]],
    ethereum: [[1, 10], [3, 30]],
  };
  const hist = buildEstimatedHistory(
    [
      { coinId: 'bitcoin', amount: 2 },
      { coinId: 'ethereum', amount: 5 },
    ],
    charts
  );
  assert.deepEqual(
    hist.map((h) => h.value),
    [2 * 100 + 5 * 10, 2 * 200 + 5 * 10, 2 * 300 + 5 * 30]
  );
});

test('isTriggered handles both directions and missing prices', () => {
  assert.equal(isTriggered('above', 101, 100), true);
  assert.equal(isTriggered('above', 99, 100), false);
  assert.equal(isTriggered('below', 99, 100), true);
  assert.equal(isTriggered('below', 101, 100), false);
  assert.equal(isTriggered('above', null, 100), false);
});
