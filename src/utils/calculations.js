// src/utils/calculations.js

/**
 * Calculate Simple Moving Average (SMA)
 */
export const calculateSMA = (prices, period) => {
  if (prices.length < period) return [];

  const smaValues = [];
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    smaValues.push(sum / period);
  }
  return smaValues;
};

/**
 * Calculate Exponential Moving Average (EMA)
 */
export const calculateEMA = (prices, period) => {
  if (prices.length < period) return [];

  const multiplier = 2 / (period + 1);
  const emaValues = [prices.slice(0, period).reduce((a, b) => a + b, 0) / period];

  for (let i = period; i < prices.length; i++) {
    const ema = (prices[i] - emaValues[emaValues.length - 1]) * multiplier + emaValues[emaValues.length - 1];
    emaValues.push(ema);
  }
  return emaValues;
};

/**
 * Calculate RSI (Relative Strength Index)
 */
export const calculateRSI = (prices, period = 14) => {
  if (prices.length < period + 1) return [];

  const rsiValues = [];
  const changes = [];

  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  for (let i = period; i < changes.length; i++) {
    const window = changes.slice(i - period, i);
    const gains = window.filter(change => change > 0).reduce((a, b) => a + b, 0) / period;
    const losses = Math.abs(window.filter(change => change < 0).reduce((a, b) => a + b, 0)) / period;

    if (losses === 0) {
      rsiValues.push(100);
    } else {
      const rs = gains / losses;
      rsiValues.push(100 - (100 / (1 + rs)));
    }
  }

  return rsiValues;
};

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export const calculateMACD = (prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);

  // Align arrays
  const startIndex = slowPeriod - fastEMA.length;
  const macdLine = fastEMA.map((fast, idx) => fast - slowEMA[idx + startIndex]);

  // Signal line (EMA of MACD)
  const signalLine = calculateEMA(macdLine, signalPeriod);
  const histogram = macdLine.slice(signalPeriod).map((macd, idx) => macd - signalLine[idx]);

  return {
    macdLine: macdLine,
    signalLine: signalLine,
    histogram: histogram,
  };
};

/**
 * Calculate Bollinger Bands
 */
export const calculateBollingerBands = (prices, period = 20, stdDev = 2) => {
  const sma = calculateSMA(prices, period);
  const bands = [];

  for (let i = 0; i < sma.length; i++) {
    const window = prices.slice(i + period - 20, i + period);
    const mean = sma[i];
    const variance = window.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
    const std = Math.sqrt(variance);

    bands.push({
      middle: mean,
      upper: mean + (stdDev * std),
      lower: mean - (stdDev * std),
    });
  }

  return bands;
};