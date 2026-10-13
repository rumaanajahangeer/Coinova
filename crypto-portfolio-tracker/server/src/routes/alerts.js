import { Router } from 'express';
import { z } from 'zod';
import Alert from '../models/Alert.js';
import { getMarkets } from '../services/coingecko.js';
import { asyncHandler, HttpError, parseObjectId } from '../utils/http.js';

const router = Router();
const MAX_ALERTS_PER_USER = 100;

const createSchema = z.object({
  coinId: z.string().trim().min(1).max(100),
  condition: z.enum(['above', 'below']),
  targetPrice: z.coerce.number().positive().finite(),
});

const ackSchema = z.object({ ids: z.array(z.string()).max(200).optional() });

const toDto = (a, market) => ({
  id: String(a._id),
  coinId: a.coinId,
  symbol: a.symbol,
  name: a.name,
  image: a.image,
  currency: a.currency,
  condition: a.condition,
  targetPrice: a.targetPrice,
  active: a.active,
  triggeredAt: a.triggeredAt,
  triggeredPrice: a.triggeredPrice,
  seen: a.seen,
  createdAt: a.createdAt,
  currentPrice: market?.[a.coinId]?.price ?? null,
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const alerts = await Alert.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
    let market = {};
    const ids = [...new Set(alerts.filter((a) => a.currency === req.user.currency).map((a) => a.coinId))];
    if (ids.length) {
      try {
        market = await getMarkets(ids, req.user.currency);
      } catch {
        /* current price is a nicety; the list still works without it */
      }
    }
    res.json({ alerts: alerts.map((a) => toDto(a, a.currency === req.user.currency ? market : null)) });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { coinId, condition, targetPrice } = createSchema.parse(req.body);
    if ((await Alert.countDocuments({ user: req.user._id })) >= MAX_ALERTS_PER_USER) {
      throw new HttpError(400, `Alert limit reached (${MAX_ALERTS_PER_USER})`);
    }
    const market = await getMarkets([coinId], req.user.currency);
    const coin = market[coinId];
    if (!coin) throw new HttpError(404, 'Unknown coin');

    const alert = await Alert.create({
      user: req.user._id,
      coinId,
      symbol: coin.symbol,
      name: coin.name,
      image: coin.image,
      currency: req.user.currency,
      condition,
      targetPrice,
    });
    res.status(201).json({ alert: toDto(alert, market) });
  })
);

// Mark triggered alerts as seen (clears the notification badge).
router.post(
  '/ack',
  asyncHandler(async (req, res) => {
    const { ids } = ackSchema.parse(req.body ?? {});
    const filter = { user: req.user._id, triggeredAt: { $ne: null }, seen: false };
    if (ids?.length) filter._id = { $in: ids.filter((id) => parseObjectId(id)) };
    const result = await Alert.updateMany(filter, { $set: { seen: true } });
    res.json({ acknowledged: result.modifiedCount });
  })
);

router.patch(
  '/:id/reactivate',
  asyncHandler(async (req, res) => {
    parseObjectId(req.params.id);
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { active: true, triggeredAt: null, triggeredPrice: null, seen: false } },
      { new: true }
    );
    if (!alert) throw new HttpError(404, 'Alert not found');
    res.json({ alert: toDto(alert) });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    parseObjectId(req.params.id);
    const result = await Alert.deleteOne({ _id: req.params.id, user: req.user._id });
    if (!result.deletedCount) throw new HttpError(404, 'Alert not found');
    res.status(204).end();
  })
);

export default router;
