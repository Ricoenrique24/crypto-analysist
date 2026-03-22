import React, { useState, useEffect, useRef, useCallback } from 'react';
import PortfolioTracker from '../components/PortfolioTracker';
import FCMAlerts from '../components/FCMAlerts';
import { FaArrowUp, FaClock, FaStar, FaFire, FaSpinner, FaVolumeUp, FaChartLine } from 'react-icons/fa';
import { getTopCoins, getCoinChart } from '../services/api';
import { calculateRSI } from '../utils/calculations';

export default function Home() {
  const [trendingCoins, setTrendingCoins] = useState([]);
  const [recommendedCoins, setRecommendedCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rsiLoading, setRsiLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [recMode, setRecMode] = useState('volume'); // 'volume' | 'rsi'
  const rsiCacheRef = useRef({}); // { coinId: rsiValue }
  const inflightRef = useRef(false); // prevent parallel fetches

  // ── Lazy load: only fetch when the section is visible ──
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // ── Load data when visible, then refresh every 60s ──
  useEffect(() => {
    if (!isVisible) return;
    loadTrending();
    const interval = setInterval(loadTrending, 60000); // 60 seconds
    return () => clearInterval(interval);
  }, [isVisible]);

  // When coins load or mode changes, recompute recommendations
  useEffect(() => {
    if (trendingCoins.length > 0) {
      if (recMode === 'volume') {
        buildVolumeRecommendations(trendingCoins);
      } else {
        buildRSIRecommendations(trendingCoins);
      }
    }
  }, [recMode, trendingCoins]);

  const loadTrending = async () => {
    if (inflightRef.current) return; // Skip if already fetching
    inflightRef.current = true;
    try {
      const data = await getTopCoins(50);
      const stablecoins = ['usdt', 'usdc', 'dai', 'fdusd', 'usde', 'usdd', 'frax', 'tusd', 'pyusd', 'usds', 'eurc'];
      const filteredCoins = data.filter(coin => 
        !stablecoins.includes(coin.symbol.toLowerCase()) &&
        coin.price_change_percentage_24h != null &&
        coin.current_price != null
      );
      setTrendingCoins(filteredCoins);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Failed to load trending coins:', e);
    } finally {
      setLoading(false);
      inflightRef.current = false;
    }
  };

  // ── Volume Mode: instant, no extra API calls ──
  const buildVolumeRecommendations = (coins) => {
    const sorted = [...coins].sort((a, b) => (b.total_volume || 0) - (a.total_volume || 0));
    setRecommendedCoins(sorted.slice(0, 3).map(c => ({ ...c, rsi: rsiCacheRef.current[c.id] || null })));
  };

  // ── RSI Mode: fetches 30D data (slow, cached) ──
  const buildRSIRecommendations = async (coins) => {
    setRsiLoading(true);
    try {
      const topCoins = coins.slice(0, 10);
      const withRSI = [];

      for (const coin of topCoins) {
        // Use cached RSI if available
        if (rsiCacheRef.current[coin.id] != null) {
          withRSI.push({ ...coin, rsi: rsiCacheRef.current[coin.id] });
          continue;
        }
        try {
          const chartData = await getCoinChart(coin.id, 30);
          const prices = chartData.prices.map(p => p[1]);
          const rsiValues = calculateRSI(prices, 14);
          if (rsiValues.length > 0) {
            const latestRSI = rsiValues[rsiValues.length - 1];
            rsiCacheRef.current[coin.id] = latestRSI;
            withRSI.push({ ...coin, rsi: latestRSI });
          }
        } catch (err) {
          console.warn(`RSI skipped for ${coin.id}:`, err.message);
        }
      }

      const highRSI = withRSI.filter(c => c.rsi > 70).sort((a, b) => b.rsi - a.rsi);
      if (highRSI.length < 3) {
        const remaining = withRSI.filter(c => c.rsi <= 70).sort((a, b) => b.rsi - a.rsi);
        while (highRSI.length < 3 && remaining.length > 0) highRSI.push(remaining.shift());
      }
      setRecommendedCoins(highRSI.slice(0, 3));
    } catch (e) {
      console.error('RSI recommendation error:', e);
    } finally {
      setRsiLoading(false);
    }
  };

  const formatPrice = (p) => {
    if (p == null) return '$0.00';
    return p >= 1 ? `$${p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$${p.toPrecision(4)}`;
  };
  const formatChange = (c) => {
    if (c == null) return '0.00%';
    return c >= 0 ? `+${c.toFixed(2)}%` : `${c.toFixed(2)}%`;
  };
  const formatVolume = (v) => {
    if (v == null) return '$0';
    if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
    return `$${v.toLocaleString()}`;
  };
  const getRSIColor = (rsi) => {
    if (rsi >= 70) return '#ef4444';
    if (rsi >= 50) return '#10b981';
    if (rsi >= 30) return '#fbbf24';
    return '#6366f1';
  };
  const getRSILabel = (rsi) => {
    if (rsi >= 70) return 'Overbought 🔥';
    if (rsi >= 50) return 'Bullish';
    if (rsi >= 30) return 'Neutral';
    return 'Oversold';
  };

  const tickerCoins = [...trendingCoins, ...trendingCoins];

  return (
    <div ref={sectionRef} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Trending Ticker */}
      {trendingCoins.length > 0 && (
        <div className="glass-card" style={{ padding: '0 0', overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Live Market
            </span>
            {lastUpdated && (
              <span className="last-updated">
                <span className="dot-live" />
                {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="ticker-container">
            <div className="ticker-track">
              {tickerCoins.map((coin, i) => (
                <a key={`${coin.id}-${i}`} href={`https://www.coingecko.com/en/coins/${coin.id}`} target="_blank" rel="noopener noreferrer" className="ticker-coin" style={{ textDecoration: 'none' }}>
                  <img src={coin.image} alt={coin.symbol} style={{ width: 20, height: 20, borderRadius: '50%' }} />
                  <span className="ticker-coin-symbol">{coin.symbol?.toUpperCase()}</span>
                  <span className="ticker-coin-price">{formatPrice(coin.current_price)}</span>
                  <span className={`ticker-coin-change ${coin.price_change_percentage_24h >= 0 ? 'up' : 'down'}`}>
                    {formatChange(coin.price_change_percentage_24h)}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading && trendingCoins.length === 0 && (
        <div className="glass-card" style={{ padding: 20 }}>
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text short" />
        </div>
      )}

      {/* Hero Section + Mode Toggle */}
      <div style={{
        background: 'var(--gradient-hero)',
        borderRadius: 'var(--radius-xl)',
        padding: '32px 28px',
        border: '1px solid var(--border-subtle)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16
      }}>
        <div>
          <h1 style={{
            fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em',
            marginBottom: 8,
            background: 'linear-gradient(135deg, var(--text-primary), var(--accent-blue-light))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Smart Recommendations</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
            {recMode === 'volume' 
              ? 'Top coins ranked by 24h trading volume.' 
              : <>Coins with <span style={{ color: '#ef4444', fontWeight: 700 }}>RSI &gt; 70</span> (overbought / strong momentum) based on 30-day data.</>
            }
          </p>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.25)', padding: 4, borderRadius: 'var(--radius-md)' }}>
          <button 
            onClick={() => setRecMode('volume')}
            style={{
              padding: '8px 16px', fontSize: '0.8rem', fontWeight: 700, borderRadius: 'var(--radius-sm)',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
              background: recMode === 'volume' ? 'var(--accent-blue-light)' : 'transparent',
              color: recMode === 'volume' ? '#fff' : 'var(--text-muted)',
            }}
          ><FaVolumeUp size={12} /> Volume</button>
          <button 
            onClick={() => setRecMode('rsi')}
            style={{
              padding: '8px 16px', fontSize: '0.8rem', fontWeight: 700, borderRadius: 'var(--radius-sm)',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
              background: recMode === 'rsi' ? 'var(--accent-blue-light)' : 'transparent',
              color: recMode === 'rsi' ? '#fff' : 'var(--text-muted)',
            }}
          ><FaChartLine size={12} /> RSI Score</button>
        </div>
      </div>

      {/* Recommended Coins */}
      {recMode === 'rsi' && rsiLoading && recommendedCoins.length === 0 ? (
        <div className="grid grid-3 stagger-children">
          {[0, 1, 2].map(i => (
            <div key={i} className="stat-card green animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 220, alignItems: 'center', justifyContent: 'center' }}>
              <FaSpinner className="spin" size={24} style={{ color: 'var(--accent-blue-light)' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Computing RSI...</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-3 stagger-children">
          {recommendedCoins.map((coin, i) => (
            <div key={`rec-${coin.id}`} className={`stat-card green animate-fade-in-up`} style={{
              display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', overflow: 'hidden'
            }}>
              {i === 0 && <div style={{
                position: 'absolute', top: 0, right: 0, background: 'var(--gradient-primary)',
                padding: '4px 12px', fontSize: '0.7rem', fontWeight: 700,
                borderBottomLeftRadius: 'var(--radius-md)', color: '#fff',
                display: 'flex', alignItems: 'center', gap: 4
              }}><FaFire /> Top Pick</div>}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src={coin.image} alt={coin.symbol} style={{ width: 36, height: 36, borderRadius: '50%' }} />
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>{coin.symbol}</h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{coin.name}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 2 }}>Current Price</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatPrice(coin.current_price)}</div>
                </div>
                <div className={`stat-change ${coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}`} style={{ fontSize: '1rem', padding: '4px 8px' }}>
                  {coin.price_change_percentage_24h >= 0 && <FaArrowUp size={12} />} {formatChange(coin.price_change_percentage_24h)}
                </div>
              </div>

              {/* RSI Badge — show if we have RSI data */}
              {coin.rsi != null && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: 'var(--radius-md)', marginTop: 4
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>30D RSI (14)</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: getRSIColor(coin.rsi) }}>
                      {coin.rsi.toFixed(1)}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700,
                    color: getRSIColor(coin.rsi),
                    background: `${getRSIColor(coin.rsi)}15`,
                    padding: '4px 10px', borderRadius: 'var(--radius-full)',
                    border: `1px solid ${getRSIColor(coin.rsi)}40`
                  }}>
                    {getRSILabel(coin.rsi)}
                  </span>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>24h Volume:</span>
                <span style={{ fontWeight: 600 }}>{formatVolume(coin.total_volume)}</span>
              </div>
              
              <a href={`https://www.coingecko.com/en/coins/${coin.id}`} target="_blank" rel="noopener noreferrer" 
                 className="btn btn-primary" style={{ width: '100%', padding: '8px', fontSize: '0.9rem', marginTop: 8, textAlign: 'center', textDecoration: 'none' }}>
                See Details
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid-1-2">
        <PortfolioTracker />
        <FCMAlerts />
      </div>
    </div>
  );
}
