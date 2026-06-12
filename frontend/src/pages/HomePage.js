import React, { useMemo } from 'react';
import MediaCard from '../components/MediaCard';

export default function HomePage({ library, loaded, profile, onSelect, api }) {
  const { movies, tv_shows } = library;

  const hero = useMemo(() => {
    const all = [...movies, ...tv_shows];
    if (!all.length) return null;
    return all[Math.floor(Math.random() * all.length)];
  }, [movies, tv_shows]);

  const isHeroMovie = hero ? movies.includes(hero) : false;

  if (!loaded) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <p style={{ color: '#aaa', fontSize: '16px' }}>Loading your library...</p>
    </div>
  );

  return (
    <div className="page-container" style={{ paddingTop: 0 }}>
      {hero && (
        <div className="hero-banner" onClick={() => onSelect(hero, isHeroMovie)}>
          {hero.backdrop && (
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${hero.backdrop})`,
              backgroundSize: 'cover', backgroundPosition: 'center top',
              filter: 'brightness(0.5)'
            }} />
          )}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to right, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)'
          }} />
          <div className="hero-content">
            <p style={{ color: '#E50914', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
              {hero.genres?.slice(0, 3).join(' · ')}
            </p>
            <h1 className="hero-title">{hero.title || hero.show_name}</h1>
            <p style={{ color: '#E50914', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
              ⭐ {hero.rating} &nbsp;·&nbsp; {isHeroMovie ? 'Movie' : 'TV Show'}
            </p>
            <p style={{ color: '#ccc', fontSize: '14px', lineHeight: 1.6, display: 'none' }}
              className="hero-overview">
              {hero.overview?.slice(0, 200)}...
            </p>
          </div>
        </div>
      )}

      {tv_shows.length > 0 && (
        <Section title="📺 TV Shows" items={tv_shows} isMovie={false} profile={profile} onSelect={onSelect} api={api} keyPrefix="home_tv" />
      )}
      {movies.length > 0 && (
        <Section title="🎬 Movies" items={movies} isMovie={true} profile={profile} onSelect={onSelect} api={api} keyPrefix="home_movie" />
      )}
    </div>
  );
}

function Section({ title, items, isMovie, profile, onSelect, api, keyPrefix }) {
  return (
    <div style={{ marginBottom: '40px' }}>
      <h3 style={{ fontFamily: 'Inter', fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>
        {title}
      </h3>
      <div className="media-grid">
        {items.slice(0, 8).map((item, i) => (
          <MediaCard key={`${keyPrefix}_${i}`} item={item} isMovie={isMovie} profile={profile} onSelect={onSelect} api={api} />
        ))}
      </div>
    </div>
  );
}