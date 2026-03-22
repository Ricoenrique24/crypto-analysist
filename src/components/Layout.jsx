import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { FaChartLine, FaWallet, FaCalculator, FaBell, FaBars, FaTimes } from 'react-icons/fa';

export default function Layout({ children }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: <FaChartLine /> },
    { name: 'Analyst', path: '/analyst', icon: <FaWallet /> },
    { name: 'DCA Strategy', path: '/dca', icon: <FaCalculator /> },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── HEADER ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(10, 14, 26, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
        }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 36, height: 36,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: '0.8rem',
              boxShadow: '0 0 16px rgba(99,102,241,0.3)',
            }}>CA</div>
            <span style={{
              fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #818cf8, #22d3ee)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Crypto Analyst</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="desktop-nav" style={{ display: 'flex', gap: 4 }}>
            {navLinks.map(link => {
              const active = location.pathname === link.path;
              return (
                <Link key={link.path} to={link.path} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 16px', borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none',
                  color: active ? 'var(--accent-blue-light)' : 'var(--text-secondary)',
                  background: active ? 'rgba(99,102,241,0.1)' : 'transparent',
                  border: active ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                  transition: 'all var(--transition-fast)',
                }}>
                  {link.icon} {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', transition: 'all var(--transition-fast)',
            }}><FaBell size={14} /></button>

            <button className="desktop-nav" style={{
              padding: '9px 20px', borderRadius: 'var(--radius-full)',
              background: 'var(--gradient-primary)', color: 'white', border: 'none',
              fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer',
              boxShadow: '0 2px 16px rgba(99,102,241,0.35)',
              transition: 'all var(--transition-fast)',
            }}>Connect Wallet</button>

            <button className="mobile-nav-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}
            >
              {mobileOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div style={{
            padding: '8px 24px 16px', display: 'flex', flexDirection: 'column', gap: 4,
            borderTop: '1px solid var(--border-subtle)',
          }}>
            {navLinks.map(link => (
              <Link key={link.path} to={link.path}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 'var(--radius-md)',
                  fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none',
                  color: location.pathname === link.path ? 'var(--accent-blue-light)' : 'var(--text-secondary)',
                  background: location.pathname === link.path ? 'rgba(99,102,241,0.1)' : 'transparent',
                }}>
                {link.icon} {link.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* ── MAIN ── */}
      <main style={{ flex: 1 }}>
        <div className="page-wrapper animate-fade-in">
          {children}
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(10, 14, 26, 0.8)',
        marginTop: 'auto',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto', padding: '40px 24px',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 6, background: 'var(--gradient-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 800, fontSize: '0.6rem',
              }}>CA</div>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>Crypto Analyst</span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Advanced analytics & automated strategies for your crypto portfolio.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Navigation</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {navLinks.map(link => (
                <Link key={link.path} to={link.path} style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Stay Updated</h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 12 }}>Get market insights and alerts.</p>
            <button className="btn btn-secondary" style={{ width: '100%' }}>Enable Notifications</button>
          </div>
        </div>
        <div style={{
          maxWidth: 1280, margin: '0 auto', padding: '16px 24px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: '0.75rem', color: 'var(--text-muted)',
          flexWrap: 'wrap', gap: 8,
        }}>
          <span>&copy; 2026 Crypto Analyst. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 16 }}>
            <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms</a>
            <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy</a>
          </div>
        </div>
      </footer>

      {/* ── MOBILE BOTTOM TAB BAR ── */}
      <nav className="mobile-bottom-bar">
        {navLinks.map(link => {
          const active = location.pathname === link.path;
          return (
            <Link key={link.path} to={link.path} className={`mobile-tab ${active ? 'active' : ''}`}>
              <span className="mobile-tab-icon">{link.icon}</span>
              {link.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}