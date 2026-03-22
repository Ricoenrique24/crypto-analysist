// src/services/api.js — CoinGecko API Service with caching
const BASE_URL = '/api/coingecko';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache to prevent 429 Too Many Requests

const cache = {};
let rateLimitedUntil = 0; // Global backoff timestamp

async function fetchWithCache(url, cacheKey) {
  const cached = cache[cacheKey];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // If we're still in a rate-limit backoff window, return cached or skip
  if (Date.now() < rateLimitedUntil) {
    if (cached) return cached.data;
    throw new Error('Rate limited — waiting before retrying');
  }

  try {
    const res = await fetch(url);
    if (res.status === 429) {
      // Back off for 60 seconds on 429
      rateLimitedUntil = Date.now() + 60 * 1000;
      console.warn(`Rate limited. Backing off for 60s.`);
      if (cached) return cached.data;
      throw new Error('API rate limited (429)');
    }
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    cache[cacheKey] = { data, timestamp: Date.now() };
    return data;
  } catch (error) {
    console.error(`Fetch error for ${cacheKey}:`, error);
    // Return cached data if available even if expired
    if (cached) return cached.data;
    throw error;
  }
}

/**
 * Get top coins by market cap (includes price, 24h change, etc.)
 */
export async function getTopCoins(limit = 20) {
  const url = `${BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`;
  return fetchWithCache(url, `top_coins_${limit}`);
}

/**
 * Get current price for specific coin IDs
 */
export async function getCoinPrices(coinIds = ['bitcoin', 'ethereum', 'solana']) {
  const ids = coinIds.join(',');
  const url = `${BASE_URL}/simple/price?ids=${ids}&vs_currency=usd&include_24hr_change=true&include_market_cap=true`;
  return fetchWithCache(url, `prices_${ids}`);
}

/**
 * Get historical market chart data (price over time)
 * @param {string} coinId — e.g. 'bitcoin'
 * @param {number} days — e.g. 30
 * @param {string} currency — 'usd' or 'idr'
 */
export async function getCoinChart(coinId = 'bitcoin', days = 30, currency = 'usd') {
  const url = `${BASE_URL}/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}`;
  return fetchWithCache(url, `chart_${coinId}_${days}_${currency}`);
}

/**
 * Build OHLC candles from a prices array [[timestamp, price], ...]
 * Groups prices into buckets of `candleMs` milliseconds
 */
function buildOHLCFromPrices(prices, candleMs) {
  if (!prices || prices.length === 0) return [];
  const candles = [];
  let bucketStart = prices[0][0];
  let open = prices[0][1], high = open, low = open, close = open;

  for (let i = 1; i < prices.length; i++) {
    const [ts, price] = prices[i];
    if (ts - bucketStart >= candleMs) {
      candles.push([bucketStart, open, high, low, close]);
      bucketStart = ts;
      open = price; high = price; low = price; close = price;
    } else {
      high = Math.max(high, price);
      low = Math.min(low, price);
      close = price;
    }
  }
  candles.push([bucketStart, open, high, low, close]); // last candle
  return candles;
}

/**
 * Get OHLC data for a specific coin.
 * Uses native OHLC endpoint for short durations (≤30 days),
 * and constructs candles from market_chart for longer durations
 * to avoid CoinGecko free-tier OHLC data limitations.
 */
export async function getCoinOHLC(coinId = 'bitcoin', days = 30, currency = 'usd') {
  if (days <= 30) {
    // Native OHLC endpoint works well for short durations
    const url = `${BASE_URL}/coins/${coinId}/ohlc?vs_currency=${currency}&days=${days}`;
    return fetchWithCache(url, `ohlc_${coinId}_${days}_${currency}`);
  }
  // For longer durations, build OHLC from market_chart prices
  const chartData = await getCoinChart(coinId, days, currency);
  // Choose candle interval based on duration
  const candleHours = days <= 90 ? 8 : days <= 180 ? 24 : 48; // 8h, 1day, or 2day candles
  const candleMs = candleHours * 60 * 60 * 1000;
  return buildOHLCFromPrices(chartData.prices, candleMs);
}

/**
 * Get trending coins
 */
export async function getTrendingCoins() {
  const url = `${BASE_URL}/search/trending`;
  return fetchWithCache(url, 'trending');
}

/**
 * Map symbol to CoinGecko ID
 */
export const COIN_MAP = {
  BTC: { id: 'bitcoin', name: 'Bitcoin', color: '#f7931a' },
  ETH: { id: 'ethereum', name: 'Ethereum', color: '#627eea' },
  SOL: { id: 'solana', name: 'Solana', color: '#9945ff' },
  BNB: { id: 'binancecoin', name: 'BNB', color: '#f3ba2f' },
  XRP: { id: 'ripple', name: 'XRP', color: '#00aae4' },
  ADA: { id: 'cardano', name: 'Cardano', color: '#0033ad' },
  DOGE: { id: 'dogecoin', name: 'Dogecoin', color: '#c2a633' },
  AVAX: { id: 'avalanche-2', name: 'Avalanche', color: '#e84142' },
};

export const COIN_LIST = Object.entries(COIN_MAP).map(([symbol, info]) => ({
  symbol,
  ...info,
}));
