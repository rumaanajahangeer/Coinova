import { Router } from 'express';
import { getAddress, isAddress } from 'ethers';
import { z } from 'zod';
import Holding from '../models/Holding.js';
import { getMarkets } from '../services/coingecko.js';
import { fetchWalletBalances } from '../services/walletService.js';
import { asyncHandler, HttpError } from '../utils/http.js';

const router = Router();

const importSchema = z.object({
  address: z
    .string()
    .trim()
    .refine((a) => isAddress(a), 'Invalid Ethereum address'),
  label: z.string().trim().max(40).optional(),
});

router.get('/', (req, res) => {
  res.json({ wallets: req.user.wallets });
});

/**
 * Import (or refresh) balances for an address. This is read-only: it never
 * asks for a signature or a private key. The address can come from MetaMask
 * (eth_requestAccounts on the client) or be pasted as a watch-only wallet.
 */
router.post(
  '/import',
  asyncHandler(async (req, res) => {
    const parsed = importSchema.parse(req.body);
    const address = getAddress(parsed.address); // checksum-normalised
    const balances = await fetchWalletBalances(address);

    const market = balances.length ? await getMarkets(balances.map((b) => b.coinId), req.user.currency) : {};

    const ops = balances.map((b) => ({
      updateOne: {
        filter: { user: req.user._id, coinId: b.coinId, source: 'wallet', walletAddress: address },
        update: {
          $set: {
            amount: b.amount,
            symbol: b.symbol,
            name: b.name,
            image: market[b.coinId]?.image || '',
          },
        },
        upsert: true,
      },
    }));
    // Drop wallet rows for tokens that are no longer held.
    ops.push({
      deleteMany: {
        filter: {
          user: req.user._id,
          source: 'wallet',
          walletAddress: address,
          coinId: { $nin: balances.map((b) => b.coinId) },
        },
      },
    });
    await Holding.bulkWrite(ops);

    if (!req.user.wallets.some((w) => w.address === address)) {
      req.user.wallets.push({ address, label: parsed.label || '' });
      await req.user.save();
    }

    res.json({ address, imported: balances.length, balances });
  })
);

router.delete(
  '/:address',
  asyncHandler(async (req, res) => {
    if (!isAddress(req.params.address)) throw new HttpError(400, 'Invalid address');
    const address = getAddress(req.params.address);
    req.user.wallets = req.user.wallets.filter((w) => w.address !== address);
    await req.user.save();
    const { deletedCount } = await Holding.deleteMany({
      user: req.user._id,
      source: 'wallet',
      walletAddress: address,
    });
    res.json({ removed: deletedCount });
  })
);

export default router;
