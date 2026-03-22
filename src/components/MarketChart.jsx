// src/components/MarketChart.jsx
import { Line } from 'react-chartjs-2';
import { calculateSMA, calculateEMA, calculateRSI, calculateMACD } from '../utils/calculations';
import Chart from 'chart.js/auto';

export default function MarketChart({ data, indicators }) {
  const prices = data.map(item => item.price);
  const len = prices.length;

  // Dynamic period based on data length
  const smaPeriod = Math.max(3, Math.min(20, Math.floor(len / 4)));
  const emaPeriod = Math.max(3, Math.min(20, Math.floor(len / 4)));
  const rsiPeriod = Math.max(3, Math.min(14, Math.floor(len / 5)));
  const macdFast = Math.max(3, Math.min(12, Math.floor(len / 6)));
  const macdSlow = Math.max(6, Math.min(26, Math.floor(len / 3)));
  const macdSignal = Math.max(3, Math.min(9, Math.floor(len / 8)));

  const chartData = {
    labels: data.map(item => item.timestamp),
    datasets: [
      {
        label: 'Price (USD)',
        data: prices,
        borderColor: '#6366f1',
        backgroundColor: (ctx) => {
          if (!ctx.chart?.chartArea) return 'rgba(99,102,241,0.08)';
          const gradient = ctx.chart.ctx.createLinearGradient(0, ctx.chart.chartArea.top, 0, ctx.chart.chartArea.bottom);
          gradient.addColorStop(0, 'rgba(99,102,241,0.15)');
          gradient.addColorStop(1, 'rgba(99,102,241,0)');
          return gradient;
        },
        tension: 0.4,
        fill: true,
        yAxisID: 'y',
        order: 1,
        borderWidth: 2,
        pointRadius: len > 30 ? 0 : 3,
        pointHoverRadius: 5,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#6366f1',
      },
    ],
  };

  if (indicators.includes('SMA') && len > smaPeriod) {
    const smaValues = calculateSMA(prices, smaPeriod);
    chartData.datasets.push({
      label: `SMA (${smaPeriod})`,
      data: Array(len - smaValues.length).fill(null).concat(smaValues),
      borderColor: '#22d3ee', tension: 0.4, fill: false, yAxisID: 'y',
      borderWidth: 1.5, pointRadius: 0,
    });
  }

  if (indicators.includes('EMA') && len > emaPeriod) {
    const emaValues = calculateEMA(prices, emaPeriod);
    chartData.datasets.push({
      label: `EMA (${emaPeriod})`,
      data: Array(len - emaValues.length).fill(null).concat(emaValues),
      borderColor: '#fbbf24', tension: 0.4, fill: false, yAxisID: 'y',
      borderWidth: 1.5, pointRadius: 0,
    });
  }

  const hasSecondary = indicators.includes('RSI') || indicators.includes('MACD');

  if (indicators.includes('RSI') && len > rsiPeriod + 1) {
    const rsiValues = calculateRSI(prices, rsiPeriod);
    chartData.datasets.push({
      label: 'RSI',
      data: Array(len - rsiValues.length).fill(null).concat(rsiValues),
      borderColor: '#a78bfa', borderDash: [6, 3], tension: 0.3, fill: false,
      yAxisID: 'y1', borderWidth: 1.5, pointRadius: 0,
    });
  }

  if (indicators.includes('MACD') && len > macdSlow) {
    const macdData = calculateMACD(prices, macdFast, macdSlow, macdSignal);
    chartData.datasets.push({
      label: 'MACD',
      data: Array(len - macdData.macdLine.length).fill(null).concat(macdData.macdLine),
      borderColor: '#f87171', tension: 0.3, fill: false,
      yAxisID: 'y1', borderWidth: 1.5, pointRadius: 0,
    });
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top', align: 'end',
        labels: {
          color: '#94a3b8',
          font: { family: "'Inter', sans-serif", size: 11, weight: '500' },
          usePointStyle: true, pointStyle: 'circle', padding: 16, boxWidth: 8,
        },
      },
      tooltip: {
        mode: 'index', intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#f1f5f9', bodyColor: '#94a3b8',
        borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1,
        padding: 12, cornerRadius: 8,
        titleFont: { weight: '600' }, bodyFont: { size: 12 },
        displayColors: true, boxPadding: 4,
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed.y;
            if (ctx.dataset.yAxisID === 'y') return `${ctx.dataset.label}: $${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
            return `${ctx.dataset.label}: ${val.toFixed(2)}`;
          }
        }
      },
    },
    scales: {
      x: {
        ticks: { color: '#475569', font: { size: 10 }, maxTicksLimit: 12, maxRotation: 0 },
        grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
      },
      y: {
        type: 'linear', display: true, position: 'left',
        title: { display: true, text: 'Price (USD)', color: '#64748b', font: { size: 11, weight: '500' } },
        ticks: {
          color: '#475569', font: { size: 10 },
          callback: v => v >= 1000 ? `$${(v/1000).toFixed(1)}k` : `$${v.toFixed(2)}`,
        },
        grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
      },
      ...(hasSecondary && {
        y1: {
          type: 'linear', display: true, position: 'right',
          title: { display: true, text: 'Oscillator', color: '#64748b', font: { size: 11, weight: '500' } },
          ticks: { color: '#475569', font: { size: 10 } },
          grid: { drawOnChartArea: false },
        }
      }),
    },
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
}