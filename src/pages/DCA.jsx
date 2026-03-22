import DCAStrategy from '../components/DCAStrategy';
import { FaCalculator } from 'react-icons/fa';

export default function DCA() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Hero */}
      <div style={{
        background: 'var(--gradient-hero)',
        borderRadius: 'var(--radius-xl)',
        padding: '32px 28px',
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--radius-md)',
            background: 'rgba(99,102,241,0.12)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue-light)',
          }}><FaCalculator size={18} /></div>
          <h1 style={{
            fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, var(--text-primary), var(--accent-blue-light))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Dollar Cost Averaging Simulator</h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', paddingLeft: 52 }}>
          Calculate and plan your recurring investments to minimize the impact of volatility over time.
        </p>
      </div>

      <DCAStrategy />
    </div>
  );
}
