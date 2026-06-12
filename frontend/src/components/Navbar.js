import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const COLORS = ['#E50914','#E87C03','#2ECC71','#3498DB','#9B59B6','#E91E8C'];

export default function Navbar({ activeProfile, onProfileSwitch, onLogout, library, onSelect, api }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [profileIndex, setProfileIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  const tabs = [
    { label: 'Home', path: '/', icon: '🏠' },
    { label: 'Movies', path: '/movies', icon: '🎬' },
    { label: 'TV Shows', path: '/tvshows', icon: '📺' },
    { label: 'Favorites', path: '/favorites', icon: '❤️' },
  ];

  useEffect(() => {
    axios.get('http://localhost:5000/api/profiles')
      .then(res => {
        const idx = res.data.findIndex(p => p.id === activeProfile?.id);
        setProfileIndex(idx >= 0 ? idx : 0);
      })
      .catch(() => {});
  }, [activeProfile]);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q || !library) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    const movies = (library.movies || [])
      .filter(m => m.title?.toLowerCase().includes(q) || m.genres?.some(g => g.toLowerCase().includes(q)))
      .map(m => ({ ...m, _isMovie: true }));
    const shows = (library.tv_shows || [])
      .filter(s => s.show_name?.toLowerCase().includes(q) || s.genres?.some(g => g.toLowerCase().includes(q)))
      .map(s => ({ ...s, _isMovie: false }));
    setResults([...movies, ...shows].slice(0, 8));
    setShowDropdown(true);
  }, [query, library]);

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleResultClick = (item) => {
    setQuery('');
    setShowDropdown(false);
    onSelect(item, item._isMovie);
    navigate('/');
  };

  const avatarColor = COLORS[profileIndex % COLORS.length];
  const initial = activeProfile?.name?.[0]?.toUpperCase() || 'U';

  return (
    <>
      {/* ── Top Navbar ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.8) 100%)',
        borderBottom: '1px solid #1a1a1a',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', height: '60px'
      }}>
        {/* Left: Logo + Nav tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span
            onClick={() => { navigate('/'); onSelect(null, false); }}
            style={{
              fontFamily: 'Bebas Neue', fontSize: '24px',
              color: '#E50914', letterSpacing: '3px', cursor: 'pointer',
              flexShrink: 0
            }}
          >
            STREAMFLIX
          </span>
          {/* Desktop tabs — hidden on mobile via CSS */}
          <div className="nav-tabs">
            {tabs.map(tab => (
              <span
                key={tab.path}
                onClick={() => { navigate(tab.path); onSelect(null, false); }}
                style={{
                  fontFamily: 'Inter', fontSize: '14px', fontWeight: 500,
                  cursor: 'pointer', padding: '4px 0',
                  color: location.pathname === tab.path ? '#fff' : '#aaa',
                  borderBottom: location.pathname === tab.path ? '2px solid #E50914' : 'none',
                  transition: 'color 0.2s', whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </span>
            ))}
          </div>
        </div>

        {/* Center: Search */}
        <div ref={searchRef} className="nav-search" style={{ position: 'relative' }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid #333', borderRadius: '6px',
            padding: '6px 12px', gap: '8px'
          }}>
            <span style={{ color: '#666', fontSize: '14px' }}>🔍</span>
            <input
              type="text"
              placeholder="Search..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setShowDropdown(true)}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                color: '#fff', fontSize: '13px', width: '100%', fontFamily: 'Inter'
              }}
            />
            {query && (
              <span
                onClick={() => { setQuery(''); setShowDropdown(false); }}
                style={{ color: '#666', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}
              >×</span>
            )}
          </div>

          {showDropdown && results.length > 0 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
              background: '#1a1a1a', border: '1px solid #333',
              borderRadius: '8px', overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.8)', zIndex: 100000
            }}>
              {results.map((item, i) => {
                const title = item.title || item.show_name;
                const genre = item.genres?.slice(0, 2).join(', ');
                return (
                  <div
                    key={i}
                    onClick={() => handleResultClick(item)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 14px', cursor: 'pointer',
                      borderBottom: i < results.length - 1 ? '1px solid #2a2a2a' : 'none',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#252525'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{
                      width: '36px', height: '54px', borderRadius: '4px',
                      overflow: 'hidden', flexShrink: 0, background: '#111'
                    }}>
                      {item.poster
                        ? <img src={item.poster} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🎬</div>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        color: '#fff', fontSize: '13px', fontWeight: 600,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                      }}>{title}</div>
                      <div style={{ color: '#888', fontSize: '11px', marginTop: '2px' }}>
                        <span style={{
                          color: item._isMovie ? '#E87C03' : '#3498DB',
                          fontWeight: 600, marginRight: '6px'
                        }}>
                          {item._isMovie ? 'Movie' : 'TV Show'}
                        </span>
                        {genre}
                      </div>
                    </div>
                    {item.rating && (
                      <div style={{ color: '#aaa', fontSize: '11px', flexShrink: 0 }}>
                        ⭐ {item.rating}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {showDropdown && query.trim() && results.length === 0 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
              background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px',
              padding: '16px', textAlign: 'center', color: '#666', fontSize: '13px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.8)', zIndex: 100000
            }}>
              No results for "{query}"
            </div>
          )}
        </div>

        {/* Right: Sign Out + Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onLogout}
            style={{
              background: 'transparent', border: '1px solid #444',
              color: '#aaa', padding: '6px 14px', borderRadius: '4px',
              fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter'
            }}
            onMouseOver={e => { e.target.style.borderColor = '#fff'; e.target.style.color = '#fff'; }}
            onMouseOut={e => { e.target.style.borderColor = '#444'; e.target.style.color = '#aaa'; }}
          >
            Sign Out
          </button>
          <div
            onClick={onProfileSwitch}
            style={{
              width: '34px', height: '34px', borderRadius: '6px',
              background: avatarColor, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '15px', fontWeight: 700, color: '#fff', cursor: 'pointer'
            }}
          >
            {initial}
          </div>
        </div>
      </nav>

      {/* ── Mobile Bottom Nav ── */}
      <div className="mobile-bottom-nav">
        {tabs.map(tab => (
          <span
            key={tab.path}
            onClick={() => { navigate(tab.path); onSelect(null, false); }}
            className={location.pathname === tab.path ? 'active' : ''}
          >
            <span style={{ fontSize: '20px' }}>{tab.icon}</span>
            {tab.label}
          </span>
        ))}
      </div>
    </>
  );
}