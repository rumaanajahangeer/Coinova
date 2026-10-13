const sumBy = (arr, fn) => arr.reduce((acc, x) => acc + fn(x), 0);

/**
 * Pure function: combine raw holdings with market data into a valued portfolio.
 * `market` is the map returned by coingecko.getMarkets().
 */
export function computePortfolio(holdings, market) {
  const rows = holdings.map((h) => {
    const m = market[h.coinId];
    const price = m?.price ?? null;
    const value = price != null ? price * h.amount : 0;
    const cost = h.buyPrice != null ? h.buyPrice * h.amount : null;
    const pnl = cost != null && price != null ? value - cost : null;
    const pnlPct = cost > 0 && pnl != null ? (pnl / cost) * 100 : null;
    const change24h = m?.change24h ?? null;
    const change24hValue =
      change24h != null && change24h > -100 ? value - value / (1 + change24h / 100) : 0;

    return {
      id: String(h._id),
      coinId: h.coinId,
      symbol: (h.symbol || m?.symbol || '').toUpperCase(),
      name: h.name || m?.name || h.coinId,
      image: h.image || m?.image || '',
      amount: h.amount,
      price,
      value,
      buyPrice: h.buyPrice ?? null,
      cost,
      pnl,
      pnlPct,
      change24h,
      change24hValue,
      source: h.source || 'manual',
      walletAddress: h.walletAddress || null,
      notes: h.notes || '',
      priceMissing: price == null,
    };
  });

  const totalValue = sumBy(rows, (r) => r.value);
  rows.forEach((r) => {
    r.allocationPct = totalValue > 0 ? (r.value / totalValue) * 100 : 0;
  });

  // Only holdings with a known cost basis AND a live price take part in P/L.
  const costRows = rows.filter((r) => r.cost != null && r.price != null);
  const costBasis = sumBy(costRows, (r) => r.cost);
  const costValue = sumBy(costRows, (r) => r.value);
  const totalPnl = costValue - costBasis;
  const totalPnlPct = costBasis > 0 ? (totalPnl / costBasis) * 100 : null;

  const change24hValue = sumBy(rows, (r) => r.change24hValue);
  const previousValue = totalValue - change24hValue;
  const change24hPct = previousValue > 0 ? (change24hValue / previousValue) * 100 : 0;

  // Allocation aggregated per coin (a coin can be held manually and in wallets).
  const byCoin = new Map();
  for (const r of rows) {
    const entry = byCoin.get(r.coinId) || {
      coinId: r.coinId,
      symbol: r.symbol,
      name: r.name,
      image: r.image,
      value: 0,
    };
    entry.value += r.value;
    byCoin.set(r.coinId, entry);
  }
  const allocation = [...byCoin.values()]
    .map((a) => ({ ...a, pct: totalValue > 0 ? (a.value / totalValue) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);

  return {
    totals: {
      value: totalValue,
      costBasis,
      pnl: costBasis > 0 ? totalPnl : null,
      pnlPct: totalPnlPct,
      change24hValue,
      change24hPct,
      holdingsCount: rows.length,
      assetsCount: allocation.length,
    },
    holdings: rows,
    allocation,
    analytics: computeAnalytics(rows, allocation),
  };
}

function computeAnalytics(rows, allocation) {
  const brief = (r, pct) => ({ coinId: r.coinId, symbol: r.symbol, name: r.name, image: r.image, pct });

  const withPnl = rows.filter((r) => r.pnlPct != null).sort((a, b) => b.pnlPct - a.pnlPct);
  const withDay = rows
    .filter((r) => r.change24h != null && r.price != null)
    .sort((a, b) => b.change24h - a.change24h);

  // Herfindahl-Hirschman Index on allocation shares (0..10000).
  const hhi = allocation.reduce((acc, a) => acc + a.pct * a.pct, 0);
  let diversification = 'n/a';
  if (allocation.length > 0) {
    diversification = hhi < 1500 ? 'diversified' : hhi < 2500 ? 'moderate' : 'concentrated';
  }

  return {
    bestPerformer: withPnl.length ? brief(withPnl[0], withPnl[0].pnlPct) : null,
    worstPerformer: withPnl.length > 1 ? brief(withPnl.at(-1), withPnl.at(-1).pnlPct) : null,
    bestToday: withDay.length ? brief(withDay[0], withDay[0].change24h) : null,
    worstToday: withDay.length > 1 ? brief(withDay.at(-1), withDay.at(-1).change24h) : null,
    largestHolding: allocation[0]
      ? { coinId: allocation[0].coinId, symbol: allocation[0].symbol, name: allocation[0].name, image: allocation[0].image, pct: allocation[0].pct }
      : null,
    hhi: Math.round(hhi),
    diversification,
  };
}

/** Summary statistics for a value series [{ t, value }]. */
export function seriesStats(points) {
  if (!points || points.length < 2) return null;
  const values = points.map((p) => p.value);
  const start = values[0];
  const end = values[values.length - 1];
  let peak = values[0];
  let maxDrawdownPct = 0;
  for (const v of values) {
    if (v > peak) peak = v;
    if (peak > 0) maxDrawdownPct = Math.max(maxDrawdownPct, ((peak - v) / peak) * 100);
  }
  return {
    start,
    end,
    change: end - start,
    changePct: start > 0 ? ((end - start) / start) * 100 : null,
    high: Math.max(...values),
    low: Math.min(...values),
    maxDrawdownPct,
  };
}

/**
 * Estimate historical portfolio value assuming the *current* amounts were held
 * throughout the period. `charts` maps coinId -> [[t, price], ...] (ascending).
 */
export function buildEstimatedHistory(holdings, charts) {
  const amounts = new Map();
  for (const h of holdings) amounts.set(h.coinId, (amounts.get(h.coinId) || 0) + h.amount);

  const series = [...amounts]
    .filter(([id]) => charts[id]?.length)
    .map(([id, amount]) => ({ amount, pts: charts[id], i: 0 }));
  if (!series.length) return [];

  const reference = series.reduce((a, b) => (b.pts.length > a.pts.length ? b : a));
  return reference.pts.map(([t]) => {
    let value = 0;
    for (const s of series) {
      while (s.i + 1 < s.pts.length && s.pts[s.i + 1][0] <= t) s.i += 1;
      value += s.amount * s.pts[s.i][1];
    }
    return { t, value };
  });
}
