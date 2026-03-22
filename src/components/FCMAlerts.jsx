import React, { useState, useEffect } from 'react';
import { requestNotificationPermission, onMessageListener, getFCMToken } from '../services/firebase';
import { FaBell, FaBellSlash, FaCheckCircle, FaCircle } from 'react-icons/fa';

export default function FCMAlerts() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [fcmToken, setFCMToken] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    checkSubscriptionStatus();
    setupMessageListener();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const token = await getFCMToken();
      if (token) { setIsSubscribed(true); setFCMToken(token); }
    } catch (error) { console.error('Error checking subscription:', error); }
  };

  const setupMessageListener = () => {
    onMessageListener((payload) => {
      setMessages(prev => [payload, ...prev]);
    });
  };

  const handleSubscribe = async () => {
    try {
      const token = await requestNotificationPermission();
      if (token) { setIsSubscribed(true); setFCMToken(token); }
    } catch (error) { console.error('Error subscribing:', error); }
  };

  const handleUnsubscribe = () => {
    setIsSubscribed(false);
    setFCMToken('');
  };

  return (
    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FaBell style={{ color: 'var(--accent-amber)' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Price Alerts</h3>
        </div>
        {isSubscribed && (
          <span className="badge badge-green">
            <FaCheckCircle size={10} /> Connected
          </span>
        )}
      </div>

      <div style={{ padding: '20px 24px' }}>
        {isSubscribed ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Your device is receiving real-time alerts.
            </p>

            {/* Token display */}
            <div style={{
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.7rem', fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              wordBreak: 'break-all',
            }}>
              Token: {fcmToken.slice(0, 32)}...
            </div>

            {/* Messages */}
            {messages.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recent</div>
                {messages.slice(0, 3).map((msg, i) => (
                  <div key={i} className="alert-item">
                    <div className="alert-dot" />
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {msg.notification?.title || 'Price Alert'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {msg.notification?.body || 'New price movement detected.'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button className="btn btn-danger" onClick={handleUnsubscribe} style={{ width: '100%' }}>
              <FaBellSlash size={13} /> Unsubscribe
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Placeholder alerts for preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { title: 'BTC crossed $65,000', time: '2 min ago' },
                { title: 'ETH RSI below 30', time: '15 min ago' },
                { title: 'SOL up 8% today', time: '1h ago' },
              ].map((a, i) => (
                <div key={i} className="alert-item">
                  <div className="alert-dot" style={{ background: i === 0 ? 'var(--accent-green)' : i === 1 ? 'var(--accent-amber)' : 'var(--accent-blue)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{a.title}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Enable notifications to get real-time price alerts.
            </p>

            <button className="btn btn-primary" onClick={handleSubscribe} style={{ width: '100%' }}>
              <FaBell size={13} /> Enable Price Alerts
            </button>
          </div>
        )}
      </div>
    </div>
  );
}