import React, { useEffect, useState } from 'react';
import axios from 'axios';

const COLORS = ['#E50914','#E87C03','#2ECC71','#3498DB','#9B59B6','#E91E8C'];

export default function ProfilePage({ onSelect, onLogout, api }) {
  const [profiles, setProfiles] = useState([]);
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    axios.get(`${api}/api/profiles`)
      .then(res => setProfiles(res.data))
      .catch(err => console.error(err));
  }, [api]);

  return (
    <div style={{
      minHeight: '100vh', background: '#141414',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center'
    }}>
      <h1 style={{
        fontFamily: 'Inter', fontSize: '36px',
        fontWeight: 400, color: '#fff', marginBottom: '48px'
      }}>
        Who&apos;s watching?
      </h1>

      <div style={{
        display: 'flex', gap: '24px', flexWrap: 'wrap',
        justifyContent: 'center', marginBottom: '48px'
      }}>
        {profiles.map((profile, i) => {
          const isHovered = hoveredId === profile.id;
          return (
            <div
              key={profile.id}
              onClick={() => onSelect(profile)}
              onMouseEnter={() => setHoveredId(profile.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '12px',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: '120px', height: '120px', borderRadius: '8px',
                background: COLORS[i % COLORS.length],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '56px', fontWeight: 700, color: '#fff',
                fontFamily: 'Inter',
                transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                boxShadow: isHovered ? `0 0 0 3px #fff` : 'none',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}>
                {profile.name[0].toUpperCase()}
              </div>
              <span style={{
                color: isHovered ? '#fff' : '#aaa',
                fontSize: '15px', fontFamily: 'Inter',
                transition: 'color 0.15s ease'
              }}>
                {profile.name}
              </span>
            </div>
          );
        })}
      </div>

      <button
        onClick={onLogout}
        style={{
          background: 'transparent', border: '1px solid #555',
          color: '#aaa', padding: '10px 24px', borderRadius: '4px',
          fontSize: '14px', cursor: 'pointer', fontFamily: 'Inter',
          transition: 'all 0.2s'
        }}
        onMouseOver={e => { e.target.style.borderColor = '#fff'; e.target.style.color = '#fff'; }}
        onMouseOut={e => { e.target.style.borderColor = '#555'; e.target.style.color = '#aaa'; }}
      >
        Sign Out
      </button>
    </div>
  );
}