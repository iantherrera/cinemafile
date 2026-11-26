import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from '../../Header';
import ScrollButton from './ScrollButton';
import { api } from '../../auth/api';
import { useAuth } from '../../auth/AuthContext';

// Movie card template. Checkboxes are controlled, so the rendered state always
// reflects movieData rather than whatever the browser last did to the DOM.
const MovieCard = ({ metaData, toggleViewed, toggleFavorite, deleteMovie }) => (
  <div className="movieCard">
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
        >
          Delete
        </button>
      </div>
    </div>
    <div className='movieInfoContainer'>
      <div className="rank">{metaData.rank}</div>
      <div className='titleYearContainer'>
        <div className='title'>{metaData.movieTitle}</div>
        <div className='year'>{metaData.year}</div>
      </div>
    </div>
    <div className='moviePosterContainer'>
      <img src={`https://image.tmdb.org/t/p/original/${metaData.posterPath}`} alt={`${metaData.movieTitle} poster`} className='posterImg' />
    </div>
    <div className='synopsis'>
      {metaData.overview}
    </div>
  </div>
);

// Functional component to render movie cards in app
export default function MovieCards() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [movieData, setMovieData] = useState([]);
  const [isListView, setIsListView] = useState(false);
  const [error, setError] = useState(null);

  // A session can expire while the page is open. When the server says so,
  // clear the stale local state and send the user to sign in again rather
  // than showing a list they can no longer save.
  const handleApiError = useCallback(async (err) => {
    if (err.status === 401) {
      await logout();
      navigate("/login", { replace: true });
      return;
    }
    setError(err.message);
  }, [logout, navigate]);

  // Load the list once on mount. Which user it belongs to is decided by the
  // session cookie, so there is no id to pass.
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

  // Replace the list with a new array and persist it. Every caller builds its
  // next value immutably, so React always sees a fresh reference and re-renders.
  const applyMovieData = useCallback(async (nextMovieData) => {
    setMovieData(nextMovieData);
    setError(null);
    try {
      await api.saveMovieData(nextMovieData);
    } catch (err) {
      handleApiError(err);
    }
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

  // Restore the default AFI list and drop back to gallery view. The server
  // owns the default and sends back what it wrote, so this neither uploads a
  // hundred records nor needs a local copy of them. The checkboxes clear
  // themselves because they read from movieData.
  const resetMovieData = useCallback(async () => {
    setIsListView(false);
    setError(null);
    try {
      const { movieData: restored } = await api.resetMovieData();
      setMovieData(restored);
    } catch (err) {
      handleApiError(err);
    }
  }, [handleApiError]);

  // Renders component display
  return (
    <div id="page">
      <Header isListView={isListView} setIsListView={setIsListView} onReset={resetMovieData} />
      <div id="bgWrap"></div>
      {error && <div className="errorMessage" role="alert">{error}</div>}
      <div id={isListView ? 'listViewContainer' : 'movieCardsContainer'} className="contentContainer">
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
