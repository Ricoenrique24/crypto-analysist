import React, { useState, useRef, useEffect } from 'react';
import MarketChart from '../components/MarketChart';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { FaFilePdf, FaImage, FaFileCsv, FaChartLine, FaChartBar } from 'react-icons/fa';
import { getCoinChart, getCoinOHLC, COIN_LIST } from '../services/api';
import CandlestickChart from '../components/CandlestickChart';

export default function Analyst() {
  const chartRef = useRef(null);
  const [indicators, setIndicators] = useState(['SMA']);
  const [selectedCoin, setSelectedCoin] = useState(COIN_LIST[0]); // BTC
  const [days, setDays] = useState(30);
  const [chartData, setChartData] = useState([]);
  const [ohlcData, setOhlcData] = useState([]);
  const [chartType, setChartType] = useState('line'); // 'line' | 'candlestick'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, [selectedCoin, days, chartType]);

  const loadChartData = async () => {
    setLoading(true);
    try {
      if (chartType === 'line') {
        const data = await getCoinChart(selectedCoin.id, days);
        const formatted = data.prices.map(([timestamp, price]) => ({
          timestamp: new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          price: price,
        }));
        const step = Math.max(1, Math.floor(formatted.length / 60));
        setChartData(formatted.filter((_, i) => i % step === 0));
      } else {
        const data = await getCoinOHLC(selectedCoin.id, days);
        setOhlcData(data);
      }
    } catch (e) {
      console.error('Failed to load chart:', e);
      // Fallback sample data for line chart
      if (chartType === 'line') {
        setChartData([
          { timestamp: 'Jan 01', price: 42100 }, { timestamp: 'Jan 02', price: 43200 },
          { timestamp: 'Jan 03', price: 41800 }, { timestamp: 'Jan 04', price: 44500 },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleIndicator = (ind) => {
    setIndicators(prev => prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]);
  };

  const exportPDF = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current, { backgroundColor: '#111827' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.setFillColor(17, 24, 39);
    pdf.rect(0, 0, pdfWidth, pdf.internal.pageSize.getHeight(), 'F');
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${selectedCoin.symbol}-analysis.pdf`);
  };

  const exportImage = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current, { backgroundColor: '#111827' });
    const link = document.createElement('a');
    link.download = `${selectedCoin.symbol}-analysis.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const exportCSV = () => {
    const csvContent = 'Date,Price\n' + chartData.map(d => `${d.timestamp},${d.price.toFixed(2)}`).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedCoin.symbol}-data.csv`;
    link.click();
  };

  const dayOptions = [
    { label: '24H', value: 1 },
    { label: '7D', value: 7 },
    { label: '30D', value: 30 },
    { label: '90D', value: 90 },
    { label: '1Y', value: 365 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Advanced Market Analyst</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginTop: 4 }}>
            Analyzing <span style={{ color: 'var(--accent-blue-light)', fontWeight: 600 }}>{selectedCoin.name}</span> with real-time CoinGecko data.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={exportCSV}><FaFileCsv size={14} /> CSV</button>
          <button className="btn btn-secondary" onClick={exportImage}><FaImage size={14} /> PNG</button>
          <button className="btn btn-primary" onClick={exportPDF}><FaFilePdf size={14} /> Export PDF</button>
        </div>
      </div>

      {/* Chart Card */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Coin Selector */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Select Coin</div>
          <div className="coin-selector">
            {COIN_LIST.slice(0, 6).map(coin => (
              <button
                key={coin.symbol}
                className={`coin-select-btn ${selectedCoin.symbol === coin.symbol ? 'active' : ''}`}
                onClick={() => setSelectedCoin(coin)}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: coin.color, display: 'inline-block' }} />
                {coin.symbol}
              </button>
            ))}
          </div>
        </div>

        {/* Time Range + Indicators + Chart Type */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 'var(--radius-md)', marginRight: 12 }}>
              <button 
                className={`indicator-pill ${chartType === 'line' ? 'active' : ''}`}
                onClick={() => setChartType('line')}
                style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
              ><FaChartLine size={12}/> Line</button>
              <button 
                className={`indicator-pill ${chartType === 'candlestick' ? 'active' : ''}`}
                onClick={() => setChartType('candlestick')}
                style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
              ><FaChartBar size={12}/> Candles</button>
            </div>

            {dayOptions.map(opt => (
              <button
                key={opt.value}
                className={`indicator-pill ${days === opt.value ? 'active' : ''}`}
                onClick={() => setDays(opt.value)}
                style={{ fontFamily: 'var(--font-sans)', letterSpacing: 0 }}
              >{opt.label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['SMA', 'EMA', 'RSI', 'MACD'].map(ind => (
              <button
                key={ind}
                className={`indicator-pill ${indicators.includes(ind) ? 'active' : ''}`}
                onClick={() => toggleIndicator(ind)}
              >{ind}</button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div ref={chartRef} style={{ padding: '24px' }}>
          {loading ? (
            <div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-md)' }} />
            </div>
          ) : (
            <div className="chart-container">
              {chartType === 'line' ? (
                <MarketChart data={chartData} indicators={indicators} />
              ) : (
                <CandlestickChart data={ohlcData} indicators={indicators} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
