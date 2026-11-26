import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from '../../Header';
import ScrollButton from './ScrollButton';
import { api } from '../../auth/api';
import { useAuth } from '../../auth/AuthContext';

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

  // Callers must pass a new array rather than a mutated one: React compares by
  // reference, and an in-place edit will not re-render.
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

  // The server owns the default list and returns what it wrote, so nothing is
  // uploaded and no local copy is needed.
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
