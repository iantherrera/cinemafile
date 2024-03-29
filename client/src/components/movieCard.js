import React, { useEffect, useState } from "react";

import Header from './Header';
import ScrollButton from './ScrollButton';

// Test user & db schema:
/* 
_id: 6369d823852305533b133048

userName: user1

password: password1

hash: passwordhash

salt: hashsalt

movieData: [] 
*/

// Movie Card template
const MovieCard = (props) => (
  <div className="movieCard">
    <div className='cardOptionsContainer'>
      <div className='viewedCheckContainer'>
        <label className="checkLabel">
          <input
            className="checkbox"
            type="checkbox"
            defaultChecked={props.metaData.checked}
            onChange={() => {
              props.toggleViewed(props.metaData.id);
            }}
          />
          Viewed
        </label>
      </div>
      <div className='favoriteCheckContainer'>
        <label className="checkLabel">
          <input
            className="checkbox"
            type="checkbox"
            defaultChecked={props.metaData.favorite}
            onChange={() => {
              props.toggleFavorite(props.metaData.id);
            }}
          />
          Favorite
        </label>
      </div>
      <div className='deleteCardContainer'>
        <button className="deleteButton" type="button"
          onClick={() => {
            props.deleteMovie(props.metaData.id);
          }}
        >
          Delete
        </button>
      </div>
    </div>
    <div className='movieInfoContainer'>
      <div className="rank">{props.metaData.rank}</div>
      <div className='titleYearContainer'>
        <div className='title'>{props.metaData.movieTitle}</div>
        <div className='year'>{props.metaData.year}</div>
      </div>
    </div>
    <div className='moviePosterContainer'>
      <img src={`https://image.tmdb.org/t/p/original/${props.metaData.posterPath}`} alt="Movie poster" className='posterImg' />
    </div>
    <div className='synopsis'>
      {props.metaData.overview}
    </div>
  </div>
);

// Functional component to render movie cards in app
export default function MovieCards() {
  const [userData, setUserData] = useState([]);
  const [movieData, setMovieData] = useState([]);
  const [isListView, setIsListView] = useState(false);

  const userId = "6369d823852305533b133048"

  // Method to fetch user data and render cards when movie list updates
  useEffect(() => {
    async function getUserData() {
      const response = await fetch(`http://localhost:5000/userData/${userId}`);

      if (!response.ok) {
        const message = `An error occurred: ${response.statusText}`;
        window.alert(message);
        return;
      }

      const userData = await response.json();
      setUserData(userData);
      const movieData = userData.movieData;
      setMovieData(movieData);
    }

    getUserData();

    return;
  }, [movieData.length]);

  // Method to update user data in server
  // Post request to update the data in the database
  async function updateUserDB(id) {
    const updatedUser = userData;

    await fetch(`http://localhost:5000/update/${id}`, {
      method: "POST",
      body: JSON.stringify(updatedUser),
      headers: {
        'Content-Type': 'application/json'
      },
    });
  }

  // Toggle viewed status and update user data
  async function toggleViewed(id) {
    const checked = userData.movieData.find(movie => movie.id === id).checked;
    const toggleCheck = !checked;
    userData.movieData.find(movie => movie.id === id).checked = toggleCheck;
    setUserData(userData);
    await updateUserDB(userData._id);
  }

  // Toggle favorite and update user data
  async function toggleFavorite(id) {
    const favorite = userData.movieData.find(movie => movie.id === id).favorite;
    const toggleFavorite = !favorite;
    userData.movieData.find(movie => movie.id === id).favorite = toggleFavorite;
    setUserData(userData);
    await updateUserDB(userData._id);
  }

  // Delete a movie entry
  async function deleteMovie(id) {
    const newMovieData = userData.movieData.filter((movies) => movies.id !== id);
    userData.movieData = newMovieData;
    await updateUserDB(userData._id);

    setUserData(userData);
    setMovieData(newMovieData);
  }

  // Populate metadata for each movie card
  function movieCards() {
    const movieMetaData = movieData;
    return movieMetaData.map((metaData) => {
      metaData.id = metaData.imdbId;
      return (
        <MovieCard
          metaData={metaData}
          toggleViewed={() => toggleViewed(metaData.id)}
          toggleFavorite={() => toggleFavorite(metaData.id)}
          deleteMovie={() => deleteMovie(metaData.id)}
          key={metaData.imdbId}
        />
      );
    });
  }

  // Renders component display
  return (
    <div id="page">
      <Header isListView={isListView} setIsListView={setIsListView} userData={userData} setUserData={setUserData} setMovieData={setMovieData} />
      <div id="bgWrap"></div>
      <div id={isListView ? 'listViewContainer' : 'movieCardsContainer'} className="contentContainer">
        {movieCards()}
      </div>
      <ScrollButton />
    </div>
  );
}