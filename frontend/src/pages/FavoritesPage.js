import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MediaCard from '../components/MediaCard';

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <p style={{ color: '#aaa', fontSize: '16px' }}>Loading your library...</p>
    </div>
  );
}

export default function FavoritesPage({ library, loaded, profile, onSelect, api }) {
  const [favKeys, setFavKeys] = useState([]);

  useEffect(() => {
    axios.get(`${api}/api/favorites/${profile.id}`)
      .then(res => setFavKeys(res.data))
      .catch(err => console.error(err));
  }, [profile.id, api]);

  const favMovies = library.movies.filter(m => favKeys.includes(m.movie_key));
  const favShows = library.tv_shows.filter(s => favKeys.includes(s.show_key));

  if (!loaded) return <LoadingScreen />;

  return (
    <div className="page-container">
      <h2 className="page-title">MY FAVORITES</h2>

      {favMovies.length === 0 && favShows.length === 0 ? (
        <p style={{ color: '#aaa', fontSize: '16px' }}>
          No favorites yet. Browse and tap the heart icon to save titles here.
        </p>
      ) : (
        <>
          {favMovies.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{
                color: '#fff', fontSize: '20px',
                fontFamily: 'Inter', marginBottom: '16px'
              }}>
                Movies
              </h3>
              <div className="media-grid">
                {favMovies.map((m, i) => (
                  <MediaCard
                    key={i}
                    item={m}
                    isMovie={true}
                    profile={profile}
                    onSelect={onSelect}
                    api={api}
                  />
                ))}
              </div>
            </div>
          )}

          {favShows.length > 0 && (
            <div>
              <h3 style={{
                color: '#fff', fontSize: '20px',
                fontFamily: 'Inter', marginBottom: '16px'
              }}>
                TV Shows
              </h3>
              <div className="media-grid">
                {favShows.map((s, i) => (
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
            </div>
          )}
        </>
      )}
    </div>
  );
}