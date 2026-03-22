import React, { useState } from 'react';
import { FaPlay, FaChartLine } from 'react-icons/fa';

export default function DCAStrategy() {
  const [investmentAmount, setInvestmentAmount] = useState(1000);
  const [investmentFrequency, setInvestmentFrequency] = useState('monthly');
  const [duration, setDuration] = useState(12);
  const [results, setResults] = useState(null);

  const frequencyMap = { weekly: 52, monthly: 12, quarterly: 4, yearly: 1 };

  const handleCalculate = () => {
    const samplePrices = [100,95,105,98,102,99,97,103,101,100,98,102,105,100,95,110,108,105,102,107,109,106,104,108,110,107,105,103,108,112,115];
    const totalInvestments = frequencyMap[investmentFrequency] * duration;
    const investmentPerPeriod = investmentAmount / totalInvestments;
    let totalShares = 0, totalInvested = 0;
    for (let i = 0; i < totalInvestments; i++) {
      const price = samplePrices[i % samplePrices.length];
      totalShares += investmentPerPeriod / price;
      totalInvested += investmentPerPeriod;
    }
    const finalValue = totalShares * samplePrices[samplePrices.length - 1];
    const profit = finalValue - totalInvested;
    const roi = (profit / totalInvested) * 100;
    setResults({
      totalInvestments,
      totalShares: totalShares.toFixed(4),
      totalInvested: totalInvested.toFixed(2),
      finalValue: finalValue.toFixed(2),
      profit: profit.toFixed(2),
      roi: roi.toFixed(2),
    });
  };

  return (
    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <FaChartLine style={{ color: 'var(--accent-blue-light)' }} />
        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>DCA Strategy Calculator</h3>
      </div>

      {/* Form */}
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div>
            <label>Investment Amount ($)</label>
            <input type="number" value={investmentAmount} onChange={e => setInvestmentAmount(parseFloat(e.target.value))} />
          </div>
          <div>
            <label>Investment Frequency</label>
            <select value={investmentFrequency} onChange={e => setInvestmentFrequency(e.target.value)}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label>Duration (months)</label>
            <input type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value))} />
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleCalculate} style={{ alignSelf: 'flex-start' }}>
          <FaPlay size={11} /> Calculate DCA Strategy
        </button>

        {/* Results */}
        {results && (
          <div className="animate-fade-in-up" style={{ marginTop: 8 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Simulation Results</div>
            <div className="results-grid">
              <div className="result-item">
                <div className="result-label">Total Investments</div>
                <div className="result-value">{results.totalInvestments}</div>
              </div>
              <div className="result-item">
                <div className="result-label">Total Shares</div>
                <div className="result-value">{results.totalShares}</div>
              </div>
              <div className="result-item">
                <div className="result-label">Total Invested</div>
                <div className="result-value">${results.totalInvested}</div>
              </div>
              <div className="result-item">
                <div className="result-label">Final Value</div>
                <div className="result-value">${results.finalValue}</div>
              </div>
              <div className="result-item profit">
                <div className="result-label">Profit</div>
                <div className="result-value">${results.profit}</div>
              </div>
              <div className="result-item highlight">
                <div className="result-label">Return on Investment</div>
                <div className="result-value">{results.roi}%</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}