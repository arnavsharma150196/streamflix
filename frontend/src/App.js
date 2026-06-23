import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import HomePage from './pages/HomePage';
import MoviesPage from './pages/MoviesPage';
import TVShowsPage from './pages/TVShowsPage';
import FavoritesPage from './pages/FavoritesPage';
import DetailPage from './pages/DetailPage';

const API = 'https://streamflix-backend-49iu.onrender.com';
axios.defaults.withCredentials = true;

// Attach token to every request
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('sf_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  const [authenticated, setAuthenticated] = useState(null);
  const [activeProfile, setActiveProfile] = useState(null);
  const [library, setLibrary] = useState({ movies: [], tv_shows: [] });
  const [libraryLoaded, setLibraryLoaded] = useState(false);

  useEffect(() => {
    axios.get(`${API}/api/auth/verify`)
      .then(res => setAuthenticated(res.data.authenticated))
      .catch(() => setAuthenticated(false));
  }, []);

  useEffect(() => {
    if (authenticated && activeProfile) {
      axios.get(`${API}/api/library`)
        .then(res => {
          setLibrary(res.data);
          setLibraryLoaded(true);
        })
        .catch(err => console.error('Library load failed:', err));
    }
  }, [authenticated, activeProfile]);

  const handleLogin = () => setAuthenticated(true);

  const handleLogout = () => {
    axios.post(`${API}/api/auth/logout`).then(() => {
      setAuthenticated(false);
      setActiveProfile(null);
      setLibraryLoaded(false);
    });
  };

  if (authenticated === null) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#141414'
      }}>
        <div style={{ color: '#E50914', fontSize: '32px', fontFamily: 'Bebas Neue' }}>
          STREAMFLIX
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          !authenticated
            ? <LoginPage onLogin={handleLogin} api={API} />
            : <Navigate to="/profiles" replace />
        } />
        <Route path="/profiles" element={
          !authenticated
            ? <Navigate to="/login" replace />
            : activeProfile
              ? <Navigate to="/" replace />
              : <ProfilePage onSelect={setActiveProfile} onLogout={handleLogout} api={API} />
        } />
        <Route path="/*" element={
          !authenticated
            ? <Navigate to="/login" replace />
            : !activeProfile
              ? <Navigate to="/profiles" replace />
              : <MainApp
                  library={library}
                  libraryLoaded={libraryLoaded}
                  activeProfile={activeProfile}
                  onProfileSwitch={() => setActiveProfile(null)}
                  onLogout={handleLogout}
                  api={API}
                />
        } />
      </Routes>
    </BrowserRouter>
  );
}

function MainApp({ library, libraryLoaded, activeProfile, onProfileSwitch, onLogout, api }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedIsMovie, setSelectedIsMovie] = useState(false);

  const handleSelect = (item, isMovie) => {
    setSelectedItem(item);
    setSelectedIsMovie(isMovie);
    window.scrollTo(0, 0);
  };

  const handleBack = () => setSelectedItem(null);

  useEffect(() => {
  const handleNav = (e) => {
    // Only handle arrow keys and enter
    if (![13, 37, 38, 39, 40].includes(e.keyCode)) return;

    const focusable = Array.from(document.querySelectorAll(
      'button, [tabindex="0"], a[href], input, select'
    )).filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 &&
             !el.disabled && el.tabIndex !== -1;
    });

    if (focusable.length === 0) return;

    const current = document.activeElement;
    const currentIndex = focusable.indexOf(current);

    if (e.keyCode === 13) {
      // Enter/OK — click current element
      if (current && current !== document.body) {
        e.preventDefault();
        current.click();
      } else {
        focusable[0]?.focus();
      }
      return;
    }

    if (currentIndex === -1) {
      e.preventDefault();
      focusable[0]?.focus();
      return;
    }

    const currentRect = current.getBoundingClientRect();
    let best = null;
    let bestScore = Infinity;

    for (const el of focusable) {
      if (el === current) continue;
      const rect = el.getBoundingClientRect();
      const dx = rect.left + rect.width / 2 - (currentRect.left + currentRect.width / 2);
      const dy = rect.top + rect.height / 2 - (currentRect.top + currentRect.height / 2);

      let valid = false;
      if (e.keyCode === 39 && dx > 0) valid = true; // Right
      if (e.keyCode === 37 && dx < 0) valid = true; // Left
      if (e.keyCode === 40 && dy > 0) valid = true; // Down
      if (e.keyCode === 38 && dy < 0) valid = true; // Up

      if (!valid) continue;

      // Score = weighted distance (primary axis weighted less)
      const primaryDist = e.keyCode === 37 || e.keyCode === 39 ? Math.abs(dx) : Math.abs(dy);
      const secondaryDist = e.keyCode === 37 || e.keyCode === 39 ? Math.abs(dy) : Math.abs(dx);
      const score = primaryDist + secondaryDist * 2;

      if (score < bestScore) {
        bestScore = score;
        best = el;
      }
    }

    if (best) {
      e.preventDefault();
      best.focus();
      best.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  };

  window.addEventListener('keydown', handleNav);
  return () => window.removeEventListener('keydown', handleNav);
}, []);

  return (
    <div>
      <div style={{ position: 'relative', zIndex: 100000 }}>
        <Navbar
          activeProfile={activeProfile}
          onProfileSwitch={onProfileSwitch}
          onLogout={onLogout}
          library={library}
          onSelect={handleSelect}
          api={api}
        />
      </div>
      <div style={{ paddingTop: '60px' }}>
        {selectedItem ? (
          <DetailPage
            item={selectedItem}
            isMovie={selectedIsMovie}
            profile={activeProfile}
            onBack={handleBack}
            api={api}
          />
        ) : (
          <Routes>
            <Route path="/" element={
              <HomePage
                library={library}
                loaded={libraryLoaded}
                profile={activeProfile}
                onSelect={handleSelect}
                api={api}
              />
            } />
            <Route path="/movies" element={
              <MoviesPage
                movies={library.movies}
                loaded={libraryLoaded}
                profile={activeProfile}
                onSelect={handleSelect}
                api={api}
              />
            } />
            <Route path="/tvshows" element={
              <TVShowsPage
                tvShows={library.tv_shows}
                loaded={libraryLoaded}
                profile={activeProfile}
                onSelect={handleSelect}
                api={api}
              />
            } />
            <Route path="/favorites" element={
              <FavoritesPage
                library={library}
                loaded={libraryLoaded}
                profile={activeProfile}
                onSelect={handleSelect}
                api={api}
              />
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        )}
      </div>
    </div>
  );
}

export default App;