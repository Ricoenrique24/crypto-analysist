import React, { useState, useEffect } from 'react';
import { FaPlus, FaArrowUp, FaArrowDown, FaSync } from 'react-icons/fa';
import { getCoinPrices, COIN_MAP } from '../services/api';

export default function PortfolioTracker() {
  const [holdings] = useState([
    { id: 1, symbol: 'BTC', name: 'Bitcoin', amount: 0.5, avgPrice: 45000 },
    { id: 2, symbol: 'ETH', name: 'Ethereum', amount: 2.5, avgPrice: 2500 },
    { id: 3, symbol: 'SOL', name: 'Solana', amount: 10, avgPrice: 100 },
  ]);

  const [livePrices, setLivePrices] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrices();
    const interval = setInterval(loadPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadPrices = async () => {
    try {
      const coinIds = holdings.map(h => COIN_MAP[h.symbol]?.id).filter(Boolean);
      const data = await getCoinPrices(coinIds);
      setLivePrices(data);
    } catch (e) {
      console.error('Failed to load prices:', e);
    } finally {
      setLoading(false);
    }
  };

  const getPrice = (symbol) => {
    if (!livePrices) return null;
    const coinId = COIN_MAP[symbol]?.id;
    return coinId ? livePrices[coinId]?.usd : null;
  };

  const fallbackPrices = { BTC: 62000, ETH: 1700, SOL: 150 };

  const totalValue = holdings.reduce((sum, h) => {
    const price = getPrice(h.symbol) || fallbackPrices[h.symbol] || h.avgPrice;
    return sum + h.amount * price;
  }, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.amount * h.avgPrice, 0);
  const profitLoss = totalValue - totalCost;
  const profitLossPercent = ((profitLoss / totalCost) * 100).toFixed(2);

  return (
    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Portfolio Holdings</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!loading && livePrices && (
            <span className="last-updated">
              <span className="dot-live" />
              Live
            </span>
          )}
          <span className={profitLoss >= 0 ? 'badge badge-green' : 'badge badge-red'}>
            {profitLoss >= 0 ? <FaArrowUp size={9} /> : <FaArrowDown size={9} />}
            {profitLoss >= 0 ? '+' : ''}{profitLossPercent}%
          </span>
        </div>
      </div>

      {/* Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border-subtle)' }}>
        <div style={{ padding: '16px 24px', background: 'var(--bg-secondary)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Value</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
            {loading ? <div className="skeleton" style={{ width: 120, height: 24 }} /> : `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          </div>
        </div>
        <div style={{ padding: '16px 24px', background: 'var(--bg-secondary)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Cost</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      {/* Holdings List */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 4px', marginBottom: 4 }}>Assets</div>
        {holdings.map(h => {
          const currentPrice = getPrice(h.symbol) || fallbackPrices[h.symbol] || h.avgPrice;
          const value = h.amount * currentPrice;
          const pnl = value - h.amount * h.avgPrice;
          const pnlPct = ((pnl / (h.amount * h.avgPrice)) * 100).toFixed(2);

          return (
            <div key={h.id} className="holdings-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className={`coin-badge ${h.symbol.toLowerCase()}`}>{h.symbol.charAt(0)}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{h.symbol}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {h.amount} @ ${h.avgPrice.toLocaleString()}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', fontVariantNumeric: 'tabular-nums' }}>
                  {loading ? <div className="skeleton" style={{ width: 80, height: 16 }} /> : `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {pnl >= 0 ? '+' : ''}{pnlPct}%
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Button */}
      <div style={{ padding: '0 20px 20px' }}>
        <button className="btn btn-primary" style={{ width: '100%' }}>
          <FaPlus size={12} /> Add Holding
        </button>
      </div>
    </div>
  );
}