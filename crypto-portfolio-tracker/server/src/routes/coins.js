import { Router } from 'express';
import { z } from 'zod';
import { getMarketChart, getTopCoins, searchCoins } from '../services/coingecko.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const q = z.string().trim().min(2).max(50).parse(req.query.q);
    res.json(await searchCoins(q));
  })
);

router.get(
  '/top',
  asyncHandler(async (req, res) => {
    const limit = z.coerce.number().int().min(1).max(50).default(20).parse(req.query.limit);
    res.json(await getTopCoins(req.user.currency, limit));
  })
);

router.get(
  '/:id/chart',
  asyncHandler(async (req, res) => {
    const days = z.coerce.number().int().min(1).max(365).default(7).parse(req.query.days);
    const prices = await getMarketChart(req.params.id, req.user.currency, days);
    res.json({
      coinId: req.params.id,
      currency: req.user.currency,
      days,
      points: prices.map(([t, price]) => ({ t, price })),
    });
  })
);

export default router;
