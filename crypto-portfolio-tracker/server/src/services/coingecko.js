import { config } from '../config.js';

const cache = new Map(); // url -> { data, expires }
const inflight = new Map(); // url -> Promise (de-duplicates concurrent identical calls)

function pruneCache() {
  if (cache.size < 1000) return;
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expires < now) cache.delete(key);
  }
}

/**
 * GET helper with an in-memory TTL cache, request de-duplication and
 * "serve stale on error" behaviour so a CoinGecko rate limit (429) does not
 * take the whole app down.
 */
async function cgFetch(path, params = {}, ttlMs = config.coingecko.priceTtlMs) {
  const url = new URL(config.coingecko.baseUrl + path);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  const key = url.toString();
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.data;
  if (inflight.has(key)) return inflight.get(key);

  const promise = (async () => {
    try {
      const headers = { accept: 'application/json' };
      if (config.coingecko.apiKey) headers[config.coingecko.keyHeader] = config.coingecko.apiKey;
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(10_000) });
      if (!res.ok) {
        if (hit) return hit.data; // stale data beats an error
        const err = new Error(
          res.status === 429
            ? 'CoinGecko rate limit reached, please try again in a moment'
            : `CoinGecko request failed (${res.status})`
        );
        err.status = res.status === 429 ? 429 : 502;
        err.expose = true;
        throw err;
      }
      const data = await res.json();
      pruneCache();
      cache.set(key, { data, expires: Date.now() + ttlMs });
      return data;
    } catch (e) {
      if (hit) return hit.data;
      if (!e.status) {
        e.status = 502;
        e.expose = true;
        e.message = 'Could not reach CoinGecko';
      }
      throw e;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

export function normalizeMarket(c) {
  return {
    id: c.id,
    symbol: (c.symbol || '').toUpperCase(),
    name: c.name,
    image: c.image,
    price: c.current_price ?? null,
    change24h: c.price_change_percentage_24h_in_currency ?? c.price_change_percentage_24h ?? null,
    marketCap: c.market_cap ?? null,
    rank: c.market_cap_rank ?? null,
  };
}

/** Current market data for a list of coin ids -> { [id]: market } */
export async function getMarkets(ids, currency = 'usd') {
  const unique = [...new Set(ids)].filter(Boolean).sort();
  const result = {};
  for (let i = 0; i < unique.length; i += 100) {
    const chunk = unique.slice(i, i + 100);
    const rows = await cgFetch('/coins/markets', {
      vs_currency: currency,
      ids: chunk.join(','),
      per_page: 250,
      page: 1,
      price_change_percentage: '24h',
      sparkline: false,
    });
    for (const row of rows) result[row.id] = normalizeMarket(row);
  }
  return result;
}

export async function getTopCoins(currency = 'usd', limit = 20) {
  const rows = await cgFetch(
    '/coins/markets',
    {
      vs_currency: currency,
      order: 'market_cap_desc',
      per_page: limit,
      page: 1,
      price_change_percentage: '24h',
      sparkline: false,
    },
    60_000
  );
  return rows.map(normalizeMarket);
}

export async function searchCoins(query) {
  const data = await cgFetch('/search', { query }, config.coingecko.searchTtlMs);
  return (data.coins || []).slice(0, 12).map((c) => ({
    id: c.id,
    name: c.name,
    symbol: c.symbol,
    rank: c.market_cap_rank ?? null,
    image: c.thumb || c.large || '',
  }));
}

/** Price history -> [[timestampMs, price], ...] downsampled to at most `maxPoints`. */
export async function getMarketChart(id, currency = 'usd', days = 30, maxPoints = 300) {
  const data = await cgFetch(
    `/coins/${encodeURIComponent(id)}/market_chart`,
    { vs_currency: currency, days },
    config.coingecko.chartTtlMs
  );
  const prices = data.prices || [];
  if (prices.length <= maxPoints) return prices;
  const step = Math.ceil(prices.length / maxPoints);
  const sampled = prices.filter((_, i) => i % step === 0);
  const last = prices[prices.length - 1];
  if (sampled[sampled.length - 1] !== last) sampled.push(last);
  return sampled;
}
