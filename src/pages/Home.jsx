import { useState, useEffect } from 'react';
import PortfolioTracker from '../components/PortfolioTracker';
import FCMAlerts from '../components/FCMAlerts';
import { FaArrowUp, FaClock, FaStar, FaFire } from 'react-icons/fa';
import { getTopCoins } from '../services/api';

export default function Home() {
  const [trendingCoins, setTrendingCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadTrending();
    const interval = setInterval(loadTrending, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadTrending = async () => {
    try {
      const data = await getTopCoins(50); // Fetch top 50 to have a wider pool of gainers
      
      // Filter out stablecoins so they don't appear in recommendations
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
    }
  };

  const stats = [
    { label: 'Total Portfolio Value', value: '$24,562.00', change: '+2.4%', positive: true, type: 'blue' },
    { label: '24h Profit / Loss', value: '+$580.40', change: '+1.2%', positive: true, type: 'green' },
    { label: 'Active Alerts', value: '3', change: 'Notifications', positive: true, type: 'amber' },
  ];

  const formatPrice = (p) => {
    if (p == null) return '$0.00';
    return p >= 1 ? `$${p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$${p.toPrecision(4)}`;
  };
  const formatChange = (c) => {
    if (c == null) return '0.00%';
    return c >= 0 ? `+${c.toFixed(2)}%` : `${c.toFixed(2)}%`;
  };

  // Duplicate for seamless scroll
  const tickerCoins = [...trendingCoins, ...trendingCoins];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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

      {/* Hero Section */}
      <div style={{
        background: 'var(--gradient-hero)',
        borderRadius: 'var(--radius-xl)',
        padding: '32px 28px',
        border: '1px solid var(--border-subtle)',
      }}>
        <h1 style={{
          fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em',
          marginBottom: 8,
          background: 'linear-gradient(135deg, var(--text-primary), var(--accent-blue-light))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>Smart Recommendations</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          Algorithmically chosen top coins based on trend and 24h performance.
        </p>
      </div>

      {/* Recommended Coins (Top 3) */}
      <div className="grid grid-3 stagger-children">
        {trendingCoins
          .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
          .slice(0, 3)
          .map((coin, i) => (
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
                <div className={`stat-change positive`} style={{ fontSize: '1rem', padding: '4px 8px' }}>
                  <FaArrowUp size={12} /> {formatChange(coin.price_change_percentage_24h)}
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>24h Volume:</span>
                <span style={{ fontWeight: 600 }}>{formatPrice(coin.total_volume)}</span>
              </div>
              
              <a href={`https://www.coingecko.com/en/coins/${coin.id}`} target="_blank" rel="noopener noreferrer" 
                 className="btn btn-primary" style={{ width: '100%', padding: '8px', fontSize: '0.9rem', marginTop: 8, textAlign: 'center', textDecoration: 'none' }}>
                See Details
              </a>
            </div>
          ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid-1-2">
        <PortfolioTracker />
        <FCMAlerts />
      </div>
    </div>
  );
}
