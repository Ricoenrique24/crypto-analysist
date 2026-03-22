import React, { useState, useRef } from 'react';
import { FaPlay, FaChartLine, FaSpinner, FaCheck } from 'react-icons/fa';
import { getCoinChart, COIN_LIST } from '../services/api';

export default function DCAStrategy() {
  const [investmentAmount, setInvestmentAmount] = useState(100);
  const [currency, setCurrency] = useState('usd');
  const [frequency, setFrequency] = useState(30); // days
  const [duration, setDuration] = useState(365); // days
  
  const [selectedCoins, setSelectedCoins] = useState(['bitcoin']); // coin ids
  const [allocations, setAllocations] = useState({ bitcoin: 100 }); // percentages
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const resultsRef = useRef(null);

  const toggleCoin = (id) => {
    setSelectedCoins(prev => {
      const next = prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id];
      
      // Auto-rebalance allocations evenly when a new coin is toggled
      if (next.length > 0) {
        const evenSplit = 100 / next.length;
        const autoAlloc = {};
        next.forEach(cId => { autoAlloc[cId] = evenSplit; });
        setAllocations(autoAlloc);
      } else {
        setAllocations({});
      }
      
      return next;
    });
  };

  const handleAllocationChange = (id, val) => {
    const numVal = parseFloat(val) || 0;
    setAllocations(prev => ({ ...prev, [id]: numVal }));
  };

  const applySmartRecommendation = () => {
    if (selectedCoins.length === 0) return;
    
    // Abstract baseline weights imitating market cap dominance
    const weights = {
      bitcoin: 50, ethereum: 30, solana: 10, binancecoin: 5,
      ripple: 2.5, cardano: 1.5, dogecoin: 0.5, 'avalanche-2': 0.5
    };

    let totalWeight = 0;
    const initialAlloc = {};
    
    selectedCoins.forEach(id => {
      const w = weights[id] || 1; 
      initialAlloc[id] = w;
      totalWeight += w;
    });

    const normalizedAlloc = {};
    let runningTotal = 0;
    
    // Sort array so the largest coin absorbs the rounding remainder
    const sortedSelected = [...selectedCoins].sort((a,b) => (weights[b]||1) - (weights[a]||1));
    
    for (let i = 0; i < sortedSelected.length; i++) {
        const id = sortedSelected[i];
        if (i === sortedSelected.length - 1) {
            normalizedAlloc[id] = Math.max(0, 100 - runningTotal); // Pad to exact 100
        } else {
            const raw = (initialAlloc[id] / totalWeight) * 100;
            const rounded = Math.round(raw);
            normalizedAlloc[id] = rounded;
            runningTotal += rounded;
        }
    }
    
    setAllocations(normalizedAlloc);
  };

  const handleCalculate = async () => {
    if (selectedCoins.length === 0) return alert('Please select at least one crypto asset!');
    
    // Validate Total Allocation = 100%
    const totalAllocation = Object.values(allocations).reduce((a, b) => a + b, 0);
    if (Math.abs(totalAllocation - 100) > 0.1) {
      return alert(`Your portfolio allocation must exactly equal 100%. Currently it is ${totalAllocation.toFixed(1)}%.`);
    }

    setLoading(true);
    setResults(null);
    try {
      const freqDays = parseInt(frequency);
      const durDays = parseInt(duration);
      const totalBuyPeriods = Math.floor(durDays / freqDays);
      const amountPerPeriod = parseFloat(investmentAmount);

      let globalInvested = 0;
      let globalValue = 0;
      const coinBreakdown = [];

      for (const coinId of selectedCoins) {
        const coinInfo = COIN_LIST.find(c => c.id === coinId);
        
        // Calculate the specific fiat allocation for this asset based on the user's customized %
        const coinAllocPct = (allocations[coinId] || 0) / 100;
        const amountPerCoinPerPeriod = amountPerPeriod * coinAllocPct;

        if (amountPerCoinPerPeriod <= 0) continue; // Skip if they allocated 0%

        // Fetch historical data in chosen currency
        const data = await getCoinChart(coinId, durDays, currency);
        const prices = data.prices; 
        
        let coinShares = 0;
        let coinInvested = 0;

        // Step through the historical array to simulate periodic buys
        const arrayStep = Math.max(1, Math.floor(prices.length / totalBuyPeriods));

        for (let i = 0; i < totalBuyPeriods; i++) {
          const priceIndex = i * arrayStep;
          if (priceIndex < prices.length) {
            const currentPrice = prices[priceIndex][1];
            coinShares += amountPerCoinPerPeriod / currentPrice;
            coinInvested += amountPerCoinPerPeriod;
          }
        }

        const latestPrice = prices[prices.length - 1][1];
        const coinFinalValue = coinShares * latestPrice;
        const profit = coinFinalValue - coinInvested;
        const roi = (profit / coinInvested) * 100;

        globalInvested += coinInvested;
        globalValue += coinFinalValue;

        coinBreakdown.push({
          id: coinId,
          name: coinInfo?.name || coinId,
          symbol: coinInfo?.symbol || coinId,
          invested: coinInvested,
          finalValue: coinFinalValue,
          profit,
          roi,
          shares: coinShares
        });
      }

      const globalProfit = globalValue - globalInvested;
      const globalRoi = (globalProfit / globalInvested) * 100;

      setResults({
        totalBuyPeriods,
        globalInvested,
        globalValue,
        globalProfit,
        globalRoi,
        coinBreakdown
      });

      // Auto-scroll to results after a short render delay
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (e) {
      console.error('DCA Engine Error:', e);
      alert('Simulation failed. Either the API Rate Limit was reached or the network failed. Please wait a minute and try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return currency === 'usd' 
      ? `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `Rp ${val.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const currentTotalAllocation = Object.values(allocations).reduce((a, b) => a + b, 0);

  return (
    <div className="glass-card" style={{ padding: 0 }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <FaChartLine style={{ color: 'var(--accent-blue-light)' }} />
        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Intelligent DCA Backtest Engine</h3>
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 32 }}>
        
        {/* Step 1: Crypto Selection */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 12 }}>
            1. Select Assets to DCA
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {COIN_LIST.map(coin => {
              const selected = selectedCoins.includes(coin.id);
              return (
                <div key={coin.id} 
                     onClick={() => toggleCoin(coin.id)}
                     style={{
                       padding: '10px 20px', borderRadius: 'var(--radius-full)', border: '1px solid',
                       borderColor: selected ? coin.color : 'var(--border-default)',
                       background: selected ? `${coin.color}25` : 'transparent',
                       color: selected ? '#fff' : 'var(--text-muted)',
                       cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem',
                       transition: 'all 0.2s', userSelect: 'none'
                     }}>
                  {selected && <FaCheck size={12} color={coin.color} />}
                  <span style={{ fontWeight: 600 }}>{coin.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Settings */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 12 }}>
            2. Configure Strategy
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Currency</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', color: '#fff' }}>
                <option value="usd">USD ($)</option>
                <option value="idr">IDR (Rupiah)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Investment Per Period</label>
              <input type="number" min="1" value={investmentAmount} onChange={e => setInvestmentAmount(e.target.value || 0)} style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', color: '#fff' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Frequency</label>
              <select value={frequency} onChange={e => setFrequency(e.target.value)} style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', color: '#fff' }}>
                <option value="1">Daily</option>
                <option value="7">Weekly</option>
                <option value="30">Monthly</option>
                <option value="90">Quarterly</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Historical Duration</label>
              <select value={duration} onChange={e => setDuration(e.target.value)} style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', color: '#fff' }}>
                <option value="90">Last 3 Months</option>
                <option value="180">Last 6 Months</option>
                <option value="365">Last 1 Year</option>
                <option value="730">Last 2 Years</option>
                <option value="1095">Last 3 Years</option>
              </select>
            </div>

          </div>
        </div>

        {/* Step 3: Portfolio Allocation */}
        {selectedCoins.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                  3. Adjust Portfolio Distribution
                </label>
                <button onClick={applySmartRecommendation} style={{ 
                  background: 'rgba(99, 102, 241, 0.15)', border: '1px solid var(--accent-blue-light)', color: 'var(--accent-blue-light)',
                  padding: '4px 12px', fontSize: '0.75rem', borderRadius: 'var(--radius-full)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' 
                }}>
                  ✨ Smart Recommendation
                </button>
              </div>
              <span style={{ 
                fontSize: '0.85rem', fontWeight: 600, 
                color: Math.abs(currentTotalAllocation - 100) < 0.1 ? 'var(--accent-green)' : 'var(--accent-red)' 
              }}>
                Total Coverage: {currentTotalAllocation.toFixed(1)}% {Math.abs(currentTotalAllocation - 100) < 0.1 ? '' : '(Must be 100%)'}
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {selectedCoins.map(coinId => {
                const coinInfo = COIN_LIST.find(c => c.id === coinId);
                return (
                  <div key={coinId} style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(0,0,0,0.15)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ minWidth: 100, fontWeight: 700 }}>{coinInfo.name}</span>
                    <input 
                      type="range" min="0" max="100" step="1" 
                      value={allocations[coinId] || 0} 
                      onChange={e => handleAllocationChange(coinId, e.target.value)} 
                      style={{ flex: 1, accentColor: coinInfo.color, cursor: 'pointer' }}
                    />
                    <input 
                      type="number" min="0" max="100" 
                      value={allocations[coinId] || 0} 
                      onChange={e => handleAllocationChange(coinId, e.target.value)} 
                      style={{ width: 64, padding: '8px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', color: '#fff', textAlign: 'center', fontWeight: 600 }}
                    />
                    <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Submit */}
        <button 
          className="btn btn-primary" 
          disabled={loading || Math.abs(currentTotalAllocation - 100) > 0.1} 
          onClick={handleCalculate} 
          style={{ 
            alignSelf: 'flex-start', padding: '14px 28px', fontSize: '1.05rem', marginTop: -8,
            opacity: Math.abs(currentTotalAllocation - 100) > 0.1 ? 0.5 : 1,
            cursor: Math.abs(currentTotalAllocation - 100) > 0.1 ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FaSpinner className="spin" /> Computing Multi-Asset Backtest...</span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FaPlay size={12} /> Run Historical Backtest</span>
          )}
        </button>

        {/* Results */}
        {results && (
          <div ref={resultsRef} className="animate-fade-in-up" style={{ marginTop: 8, borderTop: '1px solid var(--border-subtle)', paddingTop: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
               <h4 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Simulation Results</h4>
               <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Analyzed {results.totalBuyPeriods} purchase periods across {results.coinBreakdown.length} assets.</span>
            </div>
            
            {/* Global Summary */}
            <div className="grid grid-3 stagger-children" style={{ marginBottom: 28 }}>
              <div className="stat-card blue animate-fade-in-up" style={{ padding: 20 }}>
                <div className="stat-label">Total Capital Invested</div>
                <div className="stat-value">{formatCurrency(results.globalInvested)}</div>
              </div>
              <div className="stat-card green animate-fade-in-up" style={{ padding: 20 }}>
                <div className="stat-label">Current Portfolio Value</div>
                <div className="stat-value">{formatCurrency(results.globalValue)}</div>
              </div>
              <div className={`stat-card ${results.globalProfit >= 0 ? 'green' : 'amber'} animate-fade-in-up`} style={{ padding: 20 }}>
                <div className="stat-label">Net Profit / Loss</div>
                <div className="stat-value">{formatCurrency(results.globalProfit)}</div>
                <div className={`stat-change ${results.globalRoi >= 0 ? 'positive' : 'negative'}`} style={{ marginTop: 8 }}>
                   {results.globalRoi >= 0 ? '+' : ''}{results.globalRoi.toFixed(2)}% ROI
                </div>
              </div>
            </div>

            {/* Breakdown per coin */}
            <h5 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Asset Breakdown</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {results.coinBreakdown.map(coin => (
                <div key={coin.id} style={{
                  padding: '20px', background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--radius-md)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20,
                  borderLeft: `4px solid ${coin.roi >= 0 ? '#10b981' : '#ef4444'}`
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 120 }}>
                    <span style={{ fontWeight: 800, fontSize: '1.15rem' }}>{coin.name}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{coin.shares.toFixed(5)} {coin.symbol.toUpperCase()}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-blue-light)', marginTop: 4 }}>{allocations[coin.id] || 0}% Allocation</span>
                  </div>
                  <div style={{ display: 'flex', gap: '3%', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 100 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Capital Invested</span>
                      <span style={{ fontWeight: 600, fontSize: '1rem' }}>{formatCurrency(coin.invested)}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 100 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Value</span>
                      <span style={{ fontWeight: 600, fontSize: '1rem' }}>{formatCurrency(coin.finalValue)}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 80 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ROI</span>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: coin.roi >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                        {coin.roi >= 0 ? '+' : ''}{coin.roi.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}