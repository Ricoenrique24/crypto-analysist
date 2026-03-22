import React from 'react';
import Chart from 'react-apexcharts';
import { calculateSMA, calculateEMA, calculateRSI, calculateMACD } from '../utils/calculations';

export default function CandlestickChart({ data, indicators = [] }) {
  if (!data || data.length === 0) return null;

  const closePrices = data.map(item => item[4]);
  const timestamps = data.map(item => item[0]);
  const len = closePrices.length;

  // Dynamic periods scaled to data length
  const smaPeriod = Math.max(3, Math.min(20, Math.floor(len / 4)));
  const emaPeriod = Math.max(3, Math.min(20, Math.floor(len / 4)));
  const rsiPeriod = Math.max(3, Math.min(14, Math.floor(len / 5)));
  const macdFast = Math.max(3, Math.min(12, Math.floor(len / 6)));
  const macdSlow = Math.max(6, Math.min(26, Math.floor(len / 3)));
  const macdSignal = Math.max(3, Math.min(9, Math.floor(len / 8)));

  const hasRSI = indicators.includes('RSI') && len > rsiPeriod + 1;
  const hasMACD = indicators.includes('MACD') && len > macdSlow;
  const hasSMA = indicators.includes('SMA') && len > smaPeriod;
  const hasEMA = indicators.includes('EMA') && len > emaPeriod;
  const hasOscillator = hasRSI || hasMACD;

  // ── Build Series ──
  const series = [];
  const colors = [];
  const strokeWidths = [];

  // 1) Price candles — always first
  series.push({
    name: 'Price',
    type: 'candlestick',
    data: data.map(item => ({ x: new Date(item[0]), y: [item[1], item[2], item[3], item[4]] }))
  });
  colors.push('#10b981');
  strokeWidths.push(1);

  // 2) SMA overlay
  if (hasSMA) {
    const vals = calculateSMA(closePrices, smaPeriod);
    series.push({
      name: `SMA (${smaPeriod})`,
      type: 'line',
      data: vals.map((v, i) => ({ x: new Date(timestamps[i + smaPeriod - 1]), y: parseFloat(v.toFixed(2)) }))
    });
    colors.push('#22d3ee');
    strokeWidths.push(2);
  }

  // 3) EMA overlay
  if (hasEMA) {
    const vals = calculateEMA(closePrices, emaPeriod);
    series.push({
      name: `EMA (${emaPeriod})`,
      type: 'line',
      data: vals.map((v, i) => ({ x: new Date(timestamps[i + emaPeriod - 1]), y: parseFloat(v.toFixed(2)) }))
    });
    colors.push('#fbbf24');
    strokeWidths.push(2);
  }

  // 4) RSI oscillator
  if (hasRSI) {
    const vals = calculateRSI(closePrices, rsiPeriod);
    series.push({
      name: 'RSI',
      type: 'line',
      data: vals.map((v, i) => {
        const tidx = Math.min(i + rsiPeriod + 1, len - 1);
        return { x: new Date(timestamps[tidx]), y: parseFloat(v.toFixed(2)) };
      })
    });
    colors.push('#a78bfa');
    strokeWidths.push(1.5);
  }

  // 5) MACD oscillator
  if (hasMACD) {
    const macdResult = calculateMACD(closePrices, macdFast, macdSlow, macdSignal);
    const macdLine = macdResult.macdLine;
    series.push({
      name: 'MACD',
      type: 'line',
      data: macdLine.map((v, i) => {
        const tidx = Math.min(i + macdSlow - 1, len - 1);
        return { x: new Date(timestamps[tidx]), y: parseFloat(v.toFixed(2)) };
      })
    });
    colors.push('#f87171');
    strokeWidths.push(1.5);
  }

  // ── Build yaxis array: one entry per series ──
  const yaxisArr = [];

  // Price axis (index 0)
  yaxisArr.push({
    seriesName: 'Price',
    show: true,
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: {
      style: { colors: '#94a3b8' },
      formatter: (val) => {
        if (val == null || isNaN(val)) return '';
        return val >= 1000 ? `$${(val / 1000).toFixed(1)}k` : `$${val.toFixed(2)}`;
      }
    }
  });

  // SMA maps to price axis
  if (hasSMA) {
    yaxisArr.push({
      seriesName: `SMA (${smaPeriod})`,
      show: false, // shares the Price axis scale visually
    });
  }

  // EMA maps to price axis
  if (hasEMA) {
    yaxisArr.push({
      seriesName: `EMA (${emaPeriod})`,
      show: false,
    });
  }

  // RSI gets its own right-side axis
  if (hasRSI) {
    yaxisArr.push({
      seriesName: 'RSI',
      opposite: true,
      show: true,
      min: 0,
      max: 100,
      title: { text: 'RSI', style: { color: '#a78bfa', fontSize: '11px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: '#a78bfa' },
        formatter: (val) => (val != null && !isNaN(val)) ? val.toFixed(0) : ''
      }
    });
  }

  // MACD gets its own right-side axis
  if (hasMACD) {
    yaxisArr.push({
      seriesName: 'MACD',
      opposite: true,
      show: !hasRSI, // only show axis if RSI isn't already showing one
      title: hasRSI ? undefined : { text: 'MACD', style: { color: '#f87171', fontSize: '11px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: '#f87171' },
        formatter: (val) => (val != null && !isNaN(val)) ? val.toFixed(1) : ''
      }
    });
  }

  // ── Options ──
  const options = {
    chart: {
      type: 'candlestick',
      height: hasOscillator ? 480 : 420,
      background: 'transparent',
      toolbar: {
        show: true,
        tools: { download: false, selection: true, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true },
      },
      foreColor: '#94a3b8',
      fontFamily: "'Inter', sans-serif",
    },
    stroke: {
      width: strokeWidths,
      curve: 'smooth'
    },
    xaxis: {
      type: 'datetime',
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: '#94a3b8' } }
    },
    yaxis: yaxisArr,
    grid: {
      borderColor: 'rgba(255,255,255,0.03)',
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } }
    },
    plotOptions: {
      candlestick: {
        colors: { upward: '#10b981', downward: '#ef4444' },
        wick: { useFillColor: true }
      }
    },
    tooltip: {
      theme: 'dark',
      shared: false,
      intersect: false,
    },
    colors: colors,
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: '#94a3b8' },
      fontSize: '12px',
    }
  };

  const chartHeight = hasOscillator ? 480 : 420;

  return (
    <div className="candlestick-chart" style={{ height: chartHeight }}>
      <Chart options={options} series={series} height={chartHeight} />
    </div>
  );
}
