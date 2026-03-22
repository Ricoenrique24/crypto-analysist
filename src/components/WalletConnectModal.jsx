import { useState } from 'react';
import { FaWallet, FaExchangeAlt, FaTimes } from 'react-icons/fa';

export default function WalletConnectModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('web3');
  const [exchange, setExchange] = useState('tokocrypto');

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(10, 14, 26, 0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 24,
    }}>
      <div className="glass-card animate-fade-in-up" style={{
        width: '100%', maxWidth: 480, padding: 32, position: 'relative',
        background: 'rgba(20, 24, 40, 0.95)', border: '1px solid var(--border-light)'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 20, right: 20, background: 'transparent',
          border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem',
        }}>
          <FaTimes />
        </button>
        
        <h2 style={{
          fontSize: '1.5rem', fontWeight: 700, marginBottom: 24,
          background: 'linear-gradient(135deg, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>Connect Wallet</h2>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 'var(--radius-md)' }}>
          <button 
            onClick={() => setActiveTab('web3')}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 'var(--radius-sm)', border: 'none',
              background: activeTab === 'web3' ? 'var(--gradient-primary)' : 'transparent',
              color: activeTab === 'web3' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s'
            }}>
            <FaWallet /> Web3 Wallet
          </button>
          <button 
            onClick={() => setActiveTab('exchange')}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 'var(--radius-sm)', border: 'none',
              background: activeTab === 'exchange' ? 'var(--gradient-primary)' : 'transparent',
              color: activeTab === 'exchange' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s'
            }}>
            <FaExchangeAlt /> Exchange API
          </button>
        </div>

        {/* Content */}
        <div style={{ minHeight: 200 }}>
          {activeTab === 'web3' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 8 }}>
                Connect your decentralized wallet directly to analyze your on-chain portfolio.
              </p>
              <button className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" style={{ width: 24, height: 24 }} />
                MetaMask
              </button>
              <button className="btn btn-secondary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}>
                WalletConnect
              </button>
              <button className="btn btn-secondary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}>
                Phantom
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 8 }}>
                Provide Read-Only API keys to automatically track your balances from Centralized Exchanges.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Exchange</label>
                <select 
                  value={exchange} 
                  onChange={(e) => setExchange(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-md)',
                    background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-default)',
                    color: '#fff', fontSize: '1rem', outline: 'none'
                  }}>
                  <option value="tokocrypto">Tokocrypto</option>
                  <option value="indodax">Indodax</option>
                  <option value="binance">Binance</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>API Key</label>
                <input type="text" placeholder="Enter API Key" style={{
                  width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-md)',
                  background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-default)',
                  color: '#fff', fontSize: '1rem', outline: 'none'
                }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>API Secret</label>
                <input type="password" placeholder="Enter API Secret" style={{
                  width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-md)',
                  background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-default)',
                  color: '#fff', fontSize: '1rem', outline: 'none'
                }} />
              </div>

              <button className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', marginTop: 16 }} onClick={() => {
                alert('API Keys saved! Balances will be synced.');
                onClose();
              }}>
                Connect & Sync
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
