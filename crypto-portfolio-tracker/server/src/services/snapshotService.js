import { config } from '../config.js';
import Holding from '../models/Holding.js';
import Snapshot from '../models/Snapshot.js';
import User from '../models/User.js';
import { getMarkets } from './coingecko.js';
import { computePortfolio } from './portfolioService.js';

/**
 * Record the user's current portfolio value. Without `force`, a snapshot is
 * skipped when a recent one already exists (so page loads don't spam the DB).
 */
export async function takeSnapshot(user, { force = false } = {}) {
  if (!force) {
    const last = await Snapshot.findOne({ user: user._id, currency: user.currency })
      .sort({ takenAt: -1 })
      .lean();
    if (last && Date.now() - last.takenAt.getTime() < config.snapshotMinGapMs) return null;
  }

  const holdings = await Holding.find({ user: user._id }).lean();
  if (!holdings.length) return null;

  const market = await getMarkets(
    holdings.map((h) => h.coinId),
    user.currency
  );
  const { totals } = computePortfolio(holdings, market);
  if (totals.value <= 0) return null; // all prices missing, don't store a bogus zero

  return Snapshot.create({
    user: user._id,
    currency: user.currency,
    totalValue: totals.value,
    costBasis: totals.costBasis,
  });
}

/** Hourly job: snapshot every user that owns at least one holding. */
export async function runSnapshotsForAll() {
  const userIds = await Holding.distinct('user');
  const users = await User.find({ _id: { $in: userIds } });
  let taken = 0;
  for (const user of users) {
    try {
      if (await takeSnapshot(user, { force: true })) taken += 1;
    } catch (e) {
      console.warn(`snapshot failed for ${user._id}: ${e.message}`);
    }
  }
  return taken;
}
