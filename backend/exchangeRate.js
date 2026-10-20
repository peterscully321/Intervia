const FRANKFURTER_RATE_URL = 'https://api.frankfurter.dev/v2/rate/USD/INR';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_STALE_MS = 48 * 60 * 60 * 1000;

let cachedQuote = null;
let refreshInFlight = null;

async function fetchFrankfurterRate() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(FRANKFURTER_RATE_URL, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Frankfurter returned HTTP ${response.status}`);
    const data = await response.json();
    const rate = Number(data.rate);
    if (data.base !== 'USD' || data.quote !== 'INR' || !Number.isFinite(rate) || rate <= 0 || !data.date) {
      throw new Error('Frankfurter returned an invalid USD/INR quote');
    }
    return { rate, date: data.date, source: 'frankfurter', fetchedAt: Date.now(), stale: false };
  } finally {
    clearTimeout(timeout);
  }
}

async function getUsdInrRate() {
  if (cachedQuote && Date.now() - cachedQuote.fetchedAt < CACHE_TTL_MS) return cachedQuote;
  if (!refreshInFlight) {
    refreshInFlight = fetchFrankfurterRate()
      .then((quote) => {
        cachedQuote = quote;
        return quote;
      })
      .finally(() => { refreshInFlight = null; });
  }

  try {
    return await refreshInFlight;
  } catch (error) {
    if (cachedQuote && Date.now() - cachedQuote.fetchedAt < MAX_STALE_MS) {
      return { ...cachedQuote, stale: true };
    }

    // Keep an explicit operator-set rate as a cold-start fallback when the feed is unavailable.
    const fallbackRate = Number(process.env.USD_INR_RATE);
    if (Number.isFinite(fallbackRate) && fallbackRate > 0) {
      return { rate: fallbackRate, date: null, source: 'configured-fallback', fetchedAt: Date.now(), stale: true };
    }
    throw error;
  }
}

module.exports = { getUsdInrRate };
