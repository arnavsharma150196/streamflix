import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Hls from 'hls.js';

export default function DetailPage({ item, isMovie, profile, onBack, api }) {
  const title = item.title || item.show_name || '';
  const backdrop = item.backdrop || item.poster || '';
  const overview = item.overview || '';
  const rating = item.rating || 'N/A';
  const genres = item.genres?.join(' · ') || '';
  const year = item.year || '';

  const [selectedEp, setSelectedEp] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [fav, setFav] = useState(false);
  const [showNextBanner, setShowNextBanner] = useState(false);
  const [progress, setProgress] = useState({});
  const [subtitleUrl, setSubtitleUrl] = useState(null);
  const [subtitleTracks, setSubtitleTracks] = useState([]);
  const [selectedSubtitle, setSelectedSubtitle] = useState(null);

  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const hlsRef = useRef(null);
  const progressTimerRef = useRef(null);
  const allEpisodesRef = useRef([]);

  const itemKey = isMovie ? item.movie_key : item.show_key;

  // Group episodes by season
  const seasons = {};
  (item.episodes || []).forEach(ep => {
    const s = ep.season || 1;
    if (!seasons[s]) seasons[s] = [];
    seasons[s].push(ep);
  });
  const seasonNums = Object.keys(seasons).map(Number).sort();
  const allEpisodes = seasonNums.flatMap(s => seasons[s]);

  // Keep allEpisodesRef updated
  useEffect(() => {
    allEpisodesRef.current = allEpisodes;
  }, [allEpisodes]);

  // Next episode logic
  const currentEpIndex = selectedEp
    ? allEpisodes.findIndex(e => e.ep_key === selectedEp.ep_key)
    : -1;
  const nextEp = currentEpIndex >= 0 && currentEpIndex < allEpisodes.length - 1
    ? allEpisodes[currentEpIndex + 1]
    : null;

  // Load favorite state
  useEffect(() => {
    axios.get(`${api}/api/favorites/${profile.id}`)
      .then(res => setFav(res.data.includes(itemKey)))
      .catch(() => {});
  }, [api, profile.id, itemKey]);

  // Auto-select last watched episode, or nothing if no progress
  useEffect(() => {
    if (!isMovie && item.episodes?.length > 0) {
      axios.get(`${api}/api/progress/${profile.id}`)
        .then(res => {
          const savedProgress = res.data || {};
          let resumeEp = null;
          let bestProgress = 0;
          for (const ep of item.episodes) {
            const key = `${ep.show_key}_${ep.ep_key}`;
            const seconds = savedProgress[key] || 0;
            if (seconds > bestProgress) {
              bestProgress = seconds;
              resumeEp = ep;
            }
          }
          if (resumeEp) {
            setSelectedEp(resumeEp);
            setSelectedSeason(resumeEp.season || 1);
            setProgress(savedProgress);
          } else {
            const firstEp = item.episodes[0];
            setSelectedEp(null);
            setSelectedSeason(firstEp ? firstEp.season : 1);
            setProgress(savedProgress);
          }
        })
        .catch(() => {
          const firstEp = item.episodes[0];
          setSelectedEp(null);
          setSelectedSeason(firstEp ? firstEp.season : 1);
        });
    }
  }, [isMovie, item.episodes, api, profile.id]);

  // Load watch progress (for movies)
  useEffect(() => {
    if (isMovie) {
      axios.get(`${api}/api/progress/${profile.id}`)
        .then(res => setProgress(res.data))
        .catch(() => {});
    }
  }, [api, profile.id, isMovie]);

  const getToken = () => localStorage.getItem('sf_token') || '';

  const getStreamUrl = (ep) => {
    const token = getToken();
    if (isMovie) return `${api}/api/stream/movie/${item.movie_key}?token=${token}`;
    return `${api}/api/stream/tv/${ep.show_key}/${ep.ep_key}?token=${token}`;
  };

  const getProgressKey = (ep) => {
    if (isMovie) return item.movie_key;
    return `${ep.show_key}_${ep.ep_key}`;
  };

  const handleSelectEp = (ep) => {
    setSelectedEp(ep);
    setSelectedSeason(ep.season || 1);
    setShowNextBanner(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const flat_has_next = (ep) => {
    const flat = allEpisodesRef.current;
    const idx = flat.findIndex(e => e.ep_key === ep.ep_key);
    return idx >= 0 && idx < flat.length - 1;
  };

  const loadSubtitles = async (ep) => {
    // Clear subtitles
    setSubtitleUrl(prev => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return null;
    });
    setSubtitleTracks([]);
    setSelectedSubtitle(null);

    try {
      const token = getToken();
      let listUrl;
      if (isMovie) {
        listUrl = `${api}/api/subtitles/movie/${item.movie_key}/list?token=${token}`;
      } else {
        listUrl = `${api}/api/subtitles/tv/${ep.show_key}/${ep.ep_key}/list?token=${token}`;
      }
      
      const res = await axios.get(listUrl);
      const tracks = res.data || [];
      
      if (tracks.length > 0) {
        setSubtitleTracks(tracks);
        // Auto-select first track
        await selectSubtitleTrack(tracks[0], ep);
      }
    } catch {
      setSubtitleTracks([]);
    }
  };

const selectSubtitleTrack = async (track, ep) => {
    setSubtitleUrl(prev => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return null;
    });
    
    try {
      const token = getToken();
      let url;
      if (isMovie) {
        url = `${api}/api/subtitles/movie/${item.movie_key}?token=${token}&file=${track.filename}`;
      } else {
        url = `${api}/api/subtitles/tv/${ep?.show_key || selectedEp?.show_key}/${ep?.ep_key || selectedEp?.ep_key}?token=${token}&file=${track.filename}`;
      }
      
      const res = await axios.get(url, { responseType: 'blob' });
      if (res.status === 200 && res.data.size > 0) {
        const blobUrl = URL.createObjectURL(res.data);
        setSubtitleUrl(blobUrl);
        setSelectedSubtitle(track.filename);
        
        // Force subtitle track to show
        setTimeout(() => {
          const video = videoRef.current;
          if (video && video.textTracks.length > 0) {
            for (let i = 0; i < video.textTracks.length; i++) {
              video.textTracks[i].mode = 'showing';
            }
          }
        }, 500);
      }
    } catch {
      setSubtitleUrl(null);
    }
  };
  const loadStream = (ep) => {
    const streamUrl = getStreamUrl(ep);
    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setShowNextBanner(false);
    video.onended = null;
    video.ontimeupdate = null;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 30,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferSize: 60 * 1000 * 1000,
        maxBufferHole: 0.5,
        highBufferWatchdogPeriod: 2,
        nudgeMaxRetry: 10,
        startFragPrefetch: true,
        progressive: true,
        startLevel: -1,
        abrEwmaDefaultEstimate: 500000,
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      video.addEventListener('seeking', () => {
        if (hls) {
          hls.stopLoad();
          hls.startLoad(video.currentTime);
        }
      });
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const savedTime = progress[getProgressKey(ep)] || 0;
        if (savedTime > 10) video.currentTime = savedTime;
        video.play().catch(() => {});
      });
      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        const savedTime = progress[getProgressKey(ep)] || 0;
        if (savedTime > 10) video.currentTime = savedTime;
        video.play().catch(() => {});
      });
    }

    // Save progress every 10 seconds
    clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      if (!video.paused && video.currentTime > 0) {
        const key = getProgressKey(ep);
        axios.post(`${api}/api/progress/${profile.id}`, {
          item_key: key,
          seconds: Math.floor(video.currentTime)
        }).catch(() => {});
      }
    }, 10000);

    // Auto play next episode on end
    video.onended = () => {
      const flat = allEpisodesRef.current;
      const idx = flat.findIndex(e => e.ep_key === ep.ep_key);
      if (idx >= 0 && idx < flat.length - 1) {
        handleSelectEp(flat[idx + 1]);
      }
    };

    // Show next episode banner 2 mins before end
    video.ontimeupdate = () => {
      if (!video.duration) return;
      const remaining = video.duration - video.currentTime;
      if (remaining <= 120 && remaining > 0 && flat_has_next(ep)) {
        setShowNextBanner(true);
      } else if (remaining > 120) {
        setShowNextBanner(false);
      }
    };
  };

  // Load stream when episode changes
  useEffect(() => {
    if (isMovie) {
      loadStream(null);
      loadSubtitles(null);
    } else if (selectedEp) {
      loadStream(selectedEp);
      loadSubtitles(selectedEp);
    }
    return () => {
      clearInterval(progressTimerRef.current);
    };
    // eslint-disable-next-line
  }, [selectedEp, isMovie]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
      clearInterval(progressTimerRef.current);
      setSubtitleUrl(prev => {
        if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, []);

  useEffect(() => {
  const handleRemoteKey = (e) => {
    const video = videoRef.current;
    if (!video) return;

    switch(e.keyCode) {
      // Play/Pause
      case 415:  // Play
      case 19:   // Pause
      case 179:  // MediaPlayPause
        e.preventDefault();
        video.paused ? video.play() : video.pause();
        break;

      // Seek forward 10s — FastForward
      case 417:
        e.preventDefault();
        video.currentTime = Math.min(video.currentTime + 10, video.duration);
        break;

      // Seek backward 10s — Rewind
      case 412:
        e.preventDefault();
        video.currentTime = Math.max(video.currentTime - 10, 0);
        break;

      // Back — LG, Samsung, Escape
      case 461:  // LG Back
      case 10009: // Samsung Back
      case 27:   // Escape
        e.preventDefault();
        onBack();
        break;

      default:
        break;
    }
  };

  window.addEventListener('keydown', handleRemoteKey);
  return () => window.removeEventListener('keydown', handleRemoteKey);
}, [videoRef.current, selectedEp]);

  const handleFullscreen = () => {
    const container = playerContainerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'f' || e.key === 'F') {
        handleFullscreen();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const toggleFav = async () => {
    try {
      await axios.post(`${api}/api/favorites/${profile.id}`, { item_key: itemKey });
      setFav(prev => !prev);
    } catch (err) {
      console.error('Favorite toggle failed:', err);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s}s watched`;
  };

  const currentEp = selectedEp;
  const nextEpForBanner = (() => {
    if (!currentEp) return null;
    const flat = allEpisodesRef.current;
    const idx = flat.findIndex(e => e.ep_key === currentEp.ep_key);
    return idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null;
  })();

  return (
    <div style={{ paddingBottom: '64px', position: 'relative', zIndex: 1 }}>

      {/* Back button */}
      <div style={{ padding: '16px 48px 0' }}>
        <button
          onClick={onBack}
          style={{
            background: 'transparent', border: '1px solid #444',
            color: '#aaa', padding: '8px 16px', borderRadius: '4px',
            fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter',
            transition: 'all 0.2s'
          }}
          onMouseOver={e => { e.target.style.borderColor = '#fff'; e.target.style.color = '#fff'; }}
          onMouseOut={e => { e.target.style.borderColor = '#444'; e.target.style.color = '#aaa'; }}
        >
          ← Back
        </button>
      </div>

      {/* Hero Banner */}
      <div style={{
        position: 'relative', width: '100%', height: '400px',
        overflow: 'hidden', background: '#111', margin: '16px 0 0'
      }}>
        {backdrop && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${backdrop})`,
            backgroundSize: 'cover', backgroundPosition: 'center 20%',
            filter: 'brightness(0.4)'
          }} />
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)'
        }} />
        <div style={{ position: 'absolute', bottom: '40px', left: '48px', maxWidth: '580px' }}>
          <p style={{
            color: '#E50914', fontSize: '11px', fontWeight: 700,
            letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px'
          }}>
            {genres}
          </p>
          <h1 style={{
            fontFamily: 'Bebas Neue', fontSize: '58px',
            color: '#fff', lineHeight: 1, marginBottom: '12px'
          }}>
            {title}
          </h1>
          <p style={{ color: '#bbb', fontSize: '13px', marginBottom: '14px' }}>
            ⭐ {rating} &nbsp;·&nbsp; {year} &nbsp;·&nbsp; {isMovie ? 'Movie' : 'TV Show'}
          </p>
          <p style={{ color: '#ccc', fontSize: '14px', lineHeight: 1.65 }}>
            {overview?.slice(0, 220)}{overview?.length > 220 ? '...' : ''}
          </p>
        </div>
      </div>

      <div style={{ padding: '24px 48px' }}>

        {/* Favorite button */}
        <button
          onClick={toggleFav}
          style={{
            background: fav ? 'rgba(229,9,20,0.15)' : 'transparent',
            border: `1px solid ${fav ? '#E50914' : '#444'}`,
            color: fav ? '#E50914' : '#aaa',
            padding: '8px 20px', borderRadius: '4px',
            fontSize: '14px', cursor: 'pointer',
            fontFamily: 'Inter', marginBottom: '28px',
            transition: 'all 0.2s'
          }}
        >
          {fav ? '❤️ Remove from Favorites' : '🤍 Add to Favorites'}
        </button>

        <hr style={{ border: 'none', borderTop: '1px solid #222', marginBottom: '28px' }} />

        {/* Video Player */}
        <div
          ref={playerContainerRef}
          style={{
            position: 'relative', background: '#000',
            borderRadius: '12px', overflow: 'hidden',
            marginBottom: '32px',
            boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
            zIndex: 1,
            isolation: 'isolate'
          }}
        >
          {/* Player title bar */}
          <div className="player-title-bar" style={{
            background: '#111', padding: '12px 20px',
            borderBottom: '1px solid #222',
            fontFamily: 'Inter', fontSize: '14px',
            fontWeight: 600, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <span>▶ {isMovie ? title : `${title} — S${String(selectedEp?.season || 1).padStart(2, '0')}E${String(selectedEp?.episode || 1).padStart(2, '0')}`}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Subtitle selector */}
              {subtitleTracks.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#888', fontSize: '11px' }}>CC:</span>
                  {subtitleTracks.map(track => (
                    <button
                      key={track.filename}
                      onClick={() => selectSubtitleTrack(track, selectedEp)}
                      style={{
                        background: selectedSubtitle === track.filename ? '#E50914' : 'transparent',
                        border: `1px solid ${selectedSubtitle === track.filename ? '#E50914' : '#444'}`,
                        color: selectedSubtitle === track.filename ? '#fff' : '#aaa',
                        padding: '3px 8px', borderRadius: '4px',
                        fontSize: '11px', cursor: 'pointer', fontFamily: 'Inter'
                      }}
                    >
                      {track.label}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={handleFullscreen}
                style={{
                  background: 'transparent', border: '1px solid #333',
                  color: '#aaa', padding: '4px 12px', borderRadius: '4px',
                  fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter'
                }}
                onMouseOver={e => { e.target.style.color = '#fff'; e.target.style.borderColor = '#fff'; }}
                onMouseOut={e => { e.target.style.color = '#aaa'; e.target.style.borderColor = '#333'; }}
              >
                ⛶ Fullscreen
              </button>
            </div>
          </div>

          {/* Video */}
          <video
            ref={videoRef}
            controls
            playsInline
            style={{
              width: '100%', maxHeight: '600px',
              background: '#000', display: 'block',
              position: 'relative', zIndex: 1,
              pointerEvents: 'auto'
            }}
          >
            {subtitleUrl && (
              <track
                key={subtitleUrl}
                kind="subtitles"
                src={subtitleUrl}
                srcLang="en"
                label="English"
                default
              />
            )}
          </video>

          {/* Next episode banner */}
          {showNextBanner && nextEpForBanner && (
            <div className="next-ep-banner" style={{
              position: 'absolute', bottom: '70px', right: '24px',
              background: 'rgba(20,20,20,0.92)',
              border: '1px solid rgba(229,9,20,0.6)',
              borderRadius: '8px', padding: '14px 20px',
              display: 'flex', alignItems: 'center', gap: '14px',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
              zIndex: 10
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{
                  color: '#888', fontSize: '11px',
                  fontFamily: 'Inter', letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}>
                  Up Next
                </span>
                <span style={{
                  color: '#fff', fontSize: '14px',
                  fontWeight: 600, fontFamily: 'Inter'
                }}>
                  S{String(nextEpForBanner.season).padStart(2, '0')}E{String(nextEpForBanner.episode).padStart(2, '0')}
                </span>
              </div>
              <button
                onClick={() => handleSelectEp(nextEpForBanner)}
                style={{
                  background: '#E50914', border: 'none',
                  color: '#fff', padding: '8px 20px',
                  borderRadius: '4px', fontSize: '13px',
                  cursor: 'pointer', fontFamily: 'Inter',
                  fontWeight: 600, transition: 'background 0.2s'
                }}
                onMouseOver={e => e.target.style.background = '#c4070f'}
                onMouseOut={e => e.target.style.background = '#E50914'}
              >
                Next Episode →
              </button>
              <button
                onClick={() => setShowNextBanner(false)}
                style={{
                  background: 'transparent', border: 'none',
                  color: '#555', fontSize: '18px',
                  cursor: 'pointer', lineHeight: 1,
                  padding: '2px 4px'
                }}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Episodes list — TV only */}
        {!isMovie && (
          <div>
            {/* Season tabs */}
            {seasonNums.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {seasonNums.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedSeason(s)}
                    style={{
                      padding: '8px 20px', borderRadius: '20px',
                      fontSize: '13px', cursor: 'pointer',
                      fontFamily: 'Inter', fontWeight: 500,
                      transition: 'all 0.2s',
                      background: selectedSeason === s ? '#E50914' : 'transparent',
                      border: `1px solid ${selectedSeason === s ? '#E50914' : '#444'}`,
                      color: selectedSeason === s ? '#fff' : '#aaa'
                    }}
                  >
                    Season {s}
                  </button>
                ))}
              </div>
            )}

            <h3 style={{
              fontFamily: 'Inter', fontSize: '18px',
              fontWeight: 600, color: '#fff', marginBottom: '16px'
            }}>
              Season {selectedSeason}
            </h3>

            {(seasons[selectedSeason] || []).map((ep) => {
              const isPlaying = selectedEp?.ep_key === ep.ep_key;
              const epProgressKey = `${ep.show_key}_${ep.ep_key}`;
              const epProgress = progress[epProgressKey] || 0;
              const displayName = `Episode ${ep.episode}`;

              return (
                <div
                  key={ep.ep_key}
                  onClick={() => handleSelectEp(ep)}
                  style={{
                    display: 'flex', alignItems: 'center',
                    gap: '16px', padding: '16px',
                    borderRadius: '8px', marginBottom: '8px',
                    background: isPlaying ? '#2a1a1a' : '#1a1a1a',
                    border: `1px solid ${isPlaying ? '#E50914' : '#2a2a2a'}`,
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseOver={e => { if (!isPlaying) e.currentTarget.style.background = '#222'; }}
                  onMouseOut={e => { if (!isPlaying) e.currentTarget.style.background = '#1a1a1a'; }}
                >
                  <span style={{
                    fontFamily: 'Inter', fontSize: '13px',
                    color: '#888', minWidth: '36px', fontWeight: 500
                  }}>
                    E{String(ep.episode).padStart(2, '0')}
                  </span>
                  <span style={{
                    fontFamily: 'Inter', fontSize: '15px',
                    fontWeight: 600, color: isPlaying ? '#fff' : '#ddd',
                    flex: 1
                  }}>
                    {displayName}
                  </span>
                  {epProgress > 0 && (
                    <span style={{ fontFamily: 'Inter', fontSize: '11px', color: '#555' }}>
                      {formatTime(epProgress)}
                    </span>
                  )}
                  {isPlaying && (
                    <span style={{ color: '#E50914', fontSize: '12px', fontFamily: 'Inter', fontWeight: 600 }}>
                      ▶ Playing
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
