import { useState, useEffect } from 'react';
import PortfolioTracker from '../components/PortfolioTracker';
import FCMAlerts from '../components/FCMAlerts';
import { FaArrowUp, FaClock } from 'react-icons/fa';
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
      const data = await getTopCoins(15);
      setTrendingCoins(data);
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

  const formatPrice = (p) => p >= 1 ? `$${p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$${p.toPrecision(4)}`;
  const formatChange = (c) => c >= 0 ? `+${c.toFixed(2)}%` : `${c.toFixed(2)}%`;

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
                <div key={`${coin.id}-${i}`} className="ticker-coin">
                  <img src={coin.image} alt={coin.symbol} style={{ width: 20, height: 20, borderRadius: '50%' }} />
                  <span className="ticker-coin-symbol">{coin.symbol?.toUpperCase()}</span>
                  <span className="ticker-coin-price">{formatPrice(coin.current_price)}</span>
                  <span className={`ticker-coin-change ${coin.price_change_percentage_24h >= 0 ? 'up' : 'down'}`}>
                    {formatChange(coin.price_change_percentage_24h)}
                  </span>
                </div>
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
        }}>Dashboard Overview</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          Welcome back! Here's a summary of your tracked assets and recent market movements.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-3 stagger-children">
        {stats.map((s, i) => (
          <div key={i} className={`stat-card ${s.type} animate-fade-in-up`}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className={`stat-change ${s.positive ? 'positive' : 'negative'}`}>
              {s.positive && <FaArrowUp size={10} />} {s.change}
            </div>
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
