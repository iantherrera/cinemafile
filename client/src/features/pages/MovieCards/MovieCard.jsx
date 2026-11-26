import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from '../../Header';
import ScrollButton from './ScrollButton';
import { api } from '../../auth/api';
import { useAuth } from '../../auth/AuthContext';

// 342px wide is the smallest TMDB size that still looks sharp in the grid, and
// list view reuses the same URL so the thumbnail costs no extra request.
const posterUrl = (posterPath) => `https://image.tmdb.org/t/p/w342${posterPath}`;

const MovieCard = ({ metaData, toggleViewed, toggleFavorite, deleteMovie }) => (
  <article className="movieCard">
    <div className='moviePosterContainer'>
      <img
        src={posterUrl(metaData.posterPath)}
        alt={`${metaData.movieTitle} poster`}
        className='posterImg'
        loading="lazy"
        decoding="async"
      />
    </div>
    <div className='movieInfoContainer'>
      <div className="rank">{metaData.rank}</div>
      <div className='titleYearContainer'>
        <h2 className='title'>{metaData.movieTitle}</h2>
        <div className='year'>{metaData.year}</div>
      </div>
    </div>
    <p className='synopsis'>
      {metaData.overview}
    </p>
    <div className='cardOptionsContainer'>
      <div className='viewedCheckContainer'>
        <label className="checkLabel">
          <input
            className="checkbox"
            type="checkbox"
            checked={Boolean(metaData.checked)}
            onChange={() => toggleViewed(metaData.imdbId)}
          />
          Viewed
        </label>
      </div>
      <div className='favoriteCheckContainer'>
        <label className="checkLabel">
          <input
            className="checkbox"
            type="checkbox"
            checked={Boolean(metaData.favorite)}
            onChange={() => toggleFavorite(metaData.imdbId)}
          />
          Favorite
        </label>
      </div>
      <div className='deleteCardContainer'>
        <button className="deleteButton" type="button"
          onClick={() => deleteMovie(metaData.imdbId)}
          aria-label={`Delete ${metaData.movieTitle}`}
          title={`Delete ${metaData.movieTitle}`}
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>
    </div>
  </article>
);

export default function MovieCards() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [movieData, setMovieData] = useState([]);
  const [isListView, setIsListView] = useState(false);
  const [error, setError] = useState(null);

  // A session can expire while the page is open; leaving an unsavable list on
  // screen is worse than sending the user back to sign in.
  const handleApiError = useCallback(async (err) => {
    if (err.status === 401) {
      await logout();
      navigate("/login", { replace: true });
      return;
    }
    setError(err.message);
  }, [logout, navigate]);

  useEffect(() => {
    let cancelled = false;

    api.getUserData()
      .then((user) => {
        if (!cancelled) setMovieData(Array.isArray(user?.movieData) ? user.movieData : []);
      })
      .catch((err) => {
        if (!cancelled) handleApiError(err);
      });

    return () => { cancelled = true; };
  }, [handleApiError]);

  // Saves run one at a time. Fired off concurrently they can arrive in any
  // order, and the server keeps whichever lands last -- so a slow early
  // request can overwrite a later edit with a staler list.
  const pendingSave = useRef(Promise.resolve());

  // Callers must pass a new array rather than a mutated one: React compares by
  // reference, and an in-place edit will not re-render.
  const applyMovieData = useCallback((nextMovieData) => {
    setMovieData(nextMovieData);
    setError(null);

    pendingSave.current = pendingSave.current
      .then(() => api.saveMovieData(nextMovieData))
      .catch(handleApiError);

    return pendingSave.current;
  }, [handleApiError]);

  const toggleViewed = useCallback((imdbId) => {
    applyMovieData(movieData.map((movie) => (
      movie.imdbId === imdbId ? { ...movie, checked: !movie.checked } : movie
    )));
  }, [movieData, applyMovieData]);

  const toggleFavorite = useCallback((imdbId) => {
    applyMovieData(movieData.map((movie) => (
      movie.imdbId === imdbId ? { ...movie, favorite: !movie.favorite } : movie
    )));
  }, [movieData, applyMovieData]);

  const deleteMovie = useCallback((imdbId) => {
    applyMovieData(movieData.filter((movie) => movie.imdbId !== imdbId));
  }, [movieData, applyMovieData]);

  // The server owns the default list and returns what it wrote, so nothing is
  // uploaded and no local copy is needed. Queued with the saves: a reset that
  // overtook one would be undone by it a moment later.
  const resetMovieData = useCallback(() => {
    setIsListView(false);
    setError(null);

    pendingSave.current = pendingSave.current
      .then(() => api.resetMovieData())
      .then(({ movieData: restored }) => setMovieData(restored))
      .catch(handleApiError);

    return pendingSave.current;
  }, [handleApiError]);

  return (
    <div id="page">
      <Header isListView={isListView} setIsListView={setIsListView} onReset={resetMovieData} />
      <div id="bgWrap"></div>
      {error && <div className="errorMessage" role="alert">{error}</div>}
      <div id={isListView ? 'listViewContainer' : 'movieCardsContainer'}>
        {movieData.map((metaData) => (
          <MovieCard
            metaData={metaData}
            toggleViewed={toggleViewed}
            toggleFavorite={toggleFavorite}
            deleteMovie={deleteMovie}
            key={metaData.imdbId}
          />
        ))}
      </div>
      <ScrollButton />
    </div>
  );
}
