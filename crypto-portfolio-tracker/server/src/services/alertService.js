import Alert from '../models/Alert.js';
import { getMarkets } from './coingecko.js';
import { isTriggered } from './alertRules.js';

/**
 * Evaluate every active alert against current prices. Triggered alerts are
 * deactivated (one-shot) and flagged unseen so the UI can notify the user.
 * Returns the number of alerts that fired.
 */
export async function checkAlerts() {
  const alerts = await Alert.find({ active: true }).lean();
  if (!alerts.length) return 0;

  const byCurrency = new Map();
  for (const a of alerts) {
    if (!byCurrency.has(a.currency)) byCurrency.set(a.currency, new Set());
    byCurrency.get(a.currency).add(a.coinId);
  }

  const markets = {};
  for (const [currency, ids] of byCurrency) {
    try {
      markets[currency] = await getMarkets([...ids], currency);
    } catch (e) {
      console.warn(`alert price fetch failed (${currency}): ${e.message}`);
    }
  }

  let fired = 0;
  for (const a of alerts) {
    const price = markets[a.currency]?.[a.coinId]?.price;
    if (!isTriggered(a.condition, price, a.targetPrice)) continue;
    // Filter on active:true so concurrent runs can't fire the same alert twice.
    const res = await Alert.updateOne(
      { _id: a._id, active: true },
      { $set: { active: false, triggeredAt: new Date(), triggeredPrice: price, seen: false } }
    );
    if (res.modifiedCount) fired += 1;
  }
  return fired;
}
