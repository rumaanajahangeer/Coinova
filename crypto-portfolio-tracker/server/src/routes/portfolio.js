import { Router } from 'express';
import { z } from 'zod';
import Holding from '../models/Holding.js';
import Snapshot from '../models/Snapshot.js';
import { getMarketChart, getMarkets } from '../services/coingecko.js';
import {
  buildEstimatedHistory,
  computePortfolio,
  seriesStats,
} from '../services/portfolioService.js';
import { takeSnapshot } from '../services/snapshotService.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();
const MAX_COINS_FOR_ESTIMATE = 8; // keeps us inside CoinGecko's free-tier rate limit

// Current valuation, P/L, allocation and analytics.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { currency } = req.user;
    const holdings = await Holding.find({ user: req.user._id }).sort({ createdAt: 1 }).lean();
    const ids = [...new Set(holdings.map((h) => h.coinId))];
    const market = ids.length ? await getMarkets(ids, currency) : {};
    const portfolio = computePortfolio(holdings, market);

    // Record history in the background (throttled inside takeSnapshot).
    takeSnapshot(req.user).catch((e) => console.warn('snapshot failed:', e.message));

    res.json({ currency, updatedAt: new Date().toISOString(), ...portfolio });
  })
);

// Value history: recorded snapshots + an estimate built from current holdings.
router.get(
  '/history',
  asyncHandler(async (req, res) => {
    const days = z.coerce.number().int().min(1).max(365).default(30).parse(req.query.days);
    const { currency } = req.user;
    const since = new Date(Date.now() - days * 86_400_000);

    const snaps = await Snapshot.find({
      user: req.user._id,
      currency,
      takenAt: { $gte: since },
    })
      .sort({ takenAt: 1 })
      .lean();
    const snapshots = snaps.map((s) => ({ t: s.takenAt.getTime(), value: s.totalValue }));

    let estimated = [];
    let coverage = { coins: 0, of: 0 };
    const holdings = await Holding.find({ user: req.user._id }).lean();
    if (holdings.length) {
      const ids = [...new Set(holdings.map((h) => h.coinId))];
      const market = await getMarkets(ids, currency);
      const valueByCoin = new Map();
      for (const h of holdings) {
        valueByCoin.set(h.coinId, (valueByCoin.get(h.coinId) || 0) + h.amount * (market[h.coinId]?.price || 0));
      }
      const top = [...valueByCoin.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, MAX_COINS_FOR_ESTIMATE)
        .map(([id]) => id);

      const results = await Promise.allSettled(top.map((id) => getMarketChart(id, currency, days)));
      const charts = {};
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') charts[top[i]] = r.value;
      });
      estimated = buildEstimatedHistory(
        holdings.filter((h) => charts[h.coinId]),
        charts
      );
      coverage = { coins: Object.keys(charts).length, of: ids.length };
    }

    res.json({
      currency,
      days,
      snapshots,
      estimated,
      coverage,
      stats: { snapshots: seriesStats(snapshots), estimated: seriesStats(estimated) },
    });
  })
);

export default router;
