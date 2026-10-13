import { Router } from 'express';
import { z } from 'zod';
import Holding from '../models/Holding.js';
import { getMarkets } from '../services/coingecko.js';
import { asyncHandler, HttpError, parseObjectId } from '../utils/http.js';

const router = Router();

const amountField = z.coerce.number().positive().finite();
const priceField = z.coerce.number().min(0).finite().nullable();

const createSchema = z.object({
  coinId: z.string().trim().min(1).max(100),
  amount: amountField,
  buyPrice: priceField.optional(),
  notes: z.string().max(500).optional(),
});

const updateSchema = z
  .object({
    amount: amountField.optional(),
    buyPrice: priceField.optional(),
    notes: z.string().max(500).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, 'Nothing to update');

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const holdings = await Holding.find({ user: req.user._id }).sort({ createdAt: 1 });
    res.json({ holdings });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { coinId, amount, buyPrice, notes } = createSchema.parse(req.body);

    const market = (await getMarkets([coinId], req.user.currency))[coinId];
    if (!market) throw new HttpError(404, 'Unknown coin');

    // Adding more of a coin you already hold merges into one row and keeps a
    // weighted-average buy price.
    let holding = await Holding.findOne({
      user: req.user._id,
      coinId,
      source: 'manual',
      walletAddress: null,
    });

    if (holding) {
      const total = holding.amount + amount;
      if (buyPrice != null) {
        const previousPrice = holding.buyPrice ?? buyPrice;
        holding.buyPrice = (previousPrice * holding.amount + buyPrice * amount) / total;
      }
      holding.amount = total;
      if (notes) holding.notes = notes;
      await holding.save();
      return res.json({ holding, merged: true });
    }

    holding = await Holding.create({
      user: req.user._id,
      coinId,
      symbol: market.symbol,
      name: market.name,
      image: market.image,
      amount,
      buyPrice: buyPrice ?? null,
      notes: notes || '',
    });
    res.status(201).json({ holding, merged: false });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    parseObjectId(req.params.id);
    const updates = updateSchema.parse(req.body);
    const holding = await Holding.findOne({ _id: req.params.id, user: req.user._id });
    if (!holding) throw new HttpError(404, 'Holding not found');
    if (holding.source === 'wallet' && updates.amount !== undefined) {
      throw new HttpError(400, 'Wallet balances are synced from the chain; re-import the wallet instead');
    }
    Object.assign(holding, updates);
    await holding.save();
    res.json({ holding });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    parseObjectId(req.params.id);
    const result = await Holding.deleteOne({ _id: req.params.id, user: req.user._id });
    if (!result.deletedCount) throw new HttpError(404, 'Holding not found');
    res.status(204).end();
  })
);

export default router;
