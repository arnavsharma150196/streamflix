import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function MediaCard({ item, isMovie, profile, onSelect, api }) {
  const title = item.title || item.show_name || 'Unknown';
  const poster = item.poster;
  const rating = item.rating;
  const year = item.year || '';
  const itemKey = isMovie ? item.movie_key : item.show_key;

  const [hovered, setHovered] = useState(false);
  const [fav, setFav] = useState(false);

  // Load actual favorite state on mount
  useEffect(() => {
    axios.get(`${api}/api/favorites/${profile.id}`)
      .then(res => {
        setFav(res.data.includes(itemKey));
      })
      .catch(() => {});
  }, [api, profile.id, itemKey]);

  const toggleFav = async (e) => {
    e.stopPropagation();
    try {
      await axios.post(`${api}/api/favorites/${profile.id}`, { item_key: itemKey });
      setFav(prev => !prev);
    } catch (err) {
      console.error('Favorite toggle failed:', err);
    }
  };

  return (
    <div
      onClick={() => onSelect(item, isMovie)}
      onKeyDown={(e) => {
        if (e.keyCode === 13) onSelect(item, isMovie); // Enter/OK
      }}
      tabIndex={0}  // Makes it focusable
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}   // Show hover state when focused
      onBlur={() => setHovered(false)}   
      style={{
        borderRadius: '8px', overflow: 'hidden',
        background: '#1a1a1a', cursor: 'pointer',
        transform: hovered ? 'scale(1.05)' : 'scale(1)',
        boxShadow: hovered ? '0 8px 32px rgba(0,0,0,0.7)' : 'none',
        transition: 'transform 0.2s, box-shadow 0.2s',
        outline: hovered ? '2px solid #E50914' : 'none',
        marginBottom: '8px'
      }}
    >
      {/* Poster */}
      <div style={{ width: '100%', height: '260px', overflow: 'hidden', background: '#111' }}>
        {poster
          ? <img src={poster} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{
              width: '100%', height: '100%', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '48px', background: '#222'
            }}>🎬</div>
        }
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{
          fontSize: '13px', fontWeight: 600, color: '#fff',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          marginBottom: '4px'
        }}>
          {title}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '11px', color: '#888' }}>
            {rating ? `⭐ ${rating}` : ''} {year}
          </span>
          <span
            onClick={toggleFav}
            style={{ fontSize: '14px', cursor: 'pointer' }}
            title={fav ? 'Remove from favorites' : 'Add to favorites'}
          >
            {fav ? '❤️' : '🤍'}
          </span>
        </div>
      </div>
    </div>
  );
}