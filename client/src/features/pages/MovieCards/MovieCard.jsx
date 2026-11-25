import React, { useCallback, useEffect, useState } from "react";

import Header from '../../Header';
import ScrollButton from './ScrollButton';
import initMovieData from '../../../initData/initMovieData.json';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// TODO: take this from the signed-in session once login exists. Until then the
// server has no auth and every client reads the same record.
const USER_ID = "6369d823852305533b133048";

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
  const [movieData, setMovieData] = useState([]);
  const [isListView, setIsListView] = useState(false);
  const [error, setError] = useState(null);

  // Persist the list. The update route only reads movieData, so that is all we
  // send -- the full record would round-trip the account's password material
  // back to the server for no reason.
  const saveMovieData = useCallback(async (nextMovieData) => {
    const response = await fetch(`${API_BASE}/update/${USER_ID}`, {
      method: "POST",
      body: JSON.stringify({ movieData: nextMovieData }),
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Could not save changes (${response.status})`);
    }
  }, []);

  // Load the list once on mount.
  useEffect(() => {
    let cancelled = false;

    async function getUserData() {
      try {
        const response = await fetch(`${API_BASE}/userData/${USER_ID}`);
        if (!response.ok) {
          throw new Error(`Could not load your list (${response.status})`);
        }
        const user = await response.json();
        if (!cancelled) {
          setMovieData(Array.isArray(user?.movieData) ? user.movieData : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      }
    }

    getUserData();

    return () => {
      cancelled = true;
    };
  }, []);

  // Replace the list with a new array and persist it. Every caller builds its
  // next value immutably, so React always sees a fresh reference and re-renders.
  const applyMovieData = useCallback(async (nextMovieData) => {
    setMovieData(nextMovieData);
    setError(null);
    try {
      await saveMovieData(nextMovieData);
    } catch (err) {
      setError(err.message);
    }
  }, [saveMovieData]);

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

  // Restore the default AFI list and drop back to gallery view. The checkboxes
  // clear themselves because they read from movieData.
  const resetMovieData = useCallback(() => {
    setIsListView(false);
    applyMovieData(initMovieData.map((movie) => ({ ...movie })));
  }, [applyMovieData]);

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
