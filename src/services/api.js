// src/services/api.js — CoinGecko API Service with caching
const BASE_URL = '/api/coingecko';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache to prevent 429 Too Many Requests

const cache = {};

async function fetchWithCache(url, cacheKey) {
  const cached = cache[cacheKey];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const res = await fetch(url);
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
