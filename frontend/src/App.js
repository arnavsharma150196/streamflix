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