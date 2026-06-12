import React, { useState } from 'react';
import MediaCard from '../components/MediaCard';

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <p style={{ color: '#aaa', fontSize: '16px' }}>Loading your library...</p>
    </div>
  );
}

function EmptyState({ message }) {
  return <p style={{ color: '#aaa', fontSize: '16px' }}>{message}</p>;
}

function GenreFilter({ genres, selected, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
      {genres.map(g => (
        <button
          key={g}
          onClick={() => onChange(g)}
          style={{
            padding: '6px 14px', borderRadius: '20px', fontSize: '12px',
            cursor: 'pointer', fontFamily: 'Inter', transition: 'all 0.2s',
            background: selected === g ? '#E50914' : 'transparent',
            border: `1px solid ${selected === g ? '#E50914' : '#444'}`,
            color: selected === g ? '#fff' : '#aaa'
          }}
        >
          {g}
        </button>
      ))}
    </div>
  );
}

export default function TVShowsPage({ tvShows, loaded, profile, onSelect, api }) {
  const [genre, setGenre] = useState('All');
  const allGenres = ['All', ...new Set(tvShows.flatMap(s => s.genres || []))].sort();
  const filtered = genre === 'All' ? tvShows : tvShows.filter(s => s.genres?.includes(genre));

  if (!loaded) return <LoadingScreen />;

  return (
    <div className="page-container">
      <h2 className="page-title">TV SHOWS</h2>
      <GenreFilter genres={allGenres} selected={genre} onChange={setGenre} />
      <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '24px' }}>
        {filtered.length} show{filtered.length !== 1 ? 's' : ''}
      </p>
      {filtered.length === 0
        ? <EmptyState message="No TV shows found!" />
        : (
          <div className="media-grid">
            {filtered.map((s, i) => (
              <MediaCard
                key={i}
                item={s}
                isMovie={false}
                profile={profile}
                onSelect={onSelect}
                api={api}
              />
            ))}
          </div>
        )
      }
    </div>
  );
}