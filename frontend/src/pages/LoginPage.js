import React, { useState } from 'react';
import axios from 'axios';

export default function LoginPage({ onLogin, api }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

const handleLogin = async () => {
    if (!password) { setError('Please enter the password.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${api}/api/auth/login`, { password });
      if (res.data.token) {
        localStorage.setItem('sf_token', res.data.token);
      }
      onLogin();
    } catch {
      setError('Incorrect password. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{
      minHeight: '100vh', background: '#141414',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundImage: 'radial-gradient(ellipse at center, #1a0a0a 0%, #141414 70%)'
    }}>
      <div style={{
        background: 'rgba(0,0,0,0.75)', padding: '48px 40px',
        borderRadius: '12px', width: '100%', maxWidth: '400px',
        border: '1px solid #2a2a2a'
      }}>
        <h1 style={{
          fontFamily: 'Bebas Neue', fontSize: '42px',
          color: '#E50914', letterSpacing: '3px',
          textAlign: 'center', marginBottom: '8px'
        }}>
          STREAMFLIX
        </h1>
        <p style={{
          color: '#aaa', textAlign: 'center',
          fontSize: '14px', marginBottom: '32px'
        }}>
          Enter password to continue
        </p>

        <input
          type="password"
          placeholder="Family password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{
            width: '100%', padding: '14px 16px',
            background: '#333', border: '1px solid #444',
            borderRadius: '6px', color: '#fff',
            fontSize: '15px', outline: 'none',
            marginBottom: '16px', fontFamily: 'Inter'
          }}
        />

        {error && (
          <p style={{ color: '#E50914', fontSize: '13px', marginBottom: '12px' }}>
            {error}
          </p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: '14px',
            background: '#E50914', border: 'none',
            borderRadius: '6px', color: '#fff',
            fontSize: '16px', fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            fontFamily: 'Inter'
          }}
        >
          {loading ? 'Signing in...' : 'Enter StreamFlix'}
        </button>
      </div>
    </div>
  );
}