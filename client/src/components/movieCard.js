import React, { useEffect, useState } from "react";

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
        <label>
          <input
            type="checkbox"
            defaultChecked={props.metaData.checked}
            onChange={() => {
              props.toggleViewed(props.metaData.id);
            }}
          />
          Viewed
        </label>
      </div>
      <div className='favoriteButton'>
        <label>
          <input
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
        <button className="button-link" type="button"
          onClick={() => {
            props.deleteMovie(props.metaData.id);
            console.log(props.metaData.id)
          }}
        >
          Delete
        </button>
      </div>
    </div>
    <div className='rankTitleYearContainer'>
      <div className="movieRank">{props.metaData.rank}</div>
      <div className='movieTitleYearContainer'>
        <div className='movieTitle'>{props.metaData.movieTitle}</div>
        <div className='movieYear'>{props.metaData.year}</div>
      </div>
    </div>
    <div className='moviePosterContainer'>
      <img src={`https://image.tmdb.org/t/p/original/${props.metaData.posterPath}`} alt="Movie poster" className='posterImg' />
    </div>
    <div className='movieSynopsis'>
      {props.metaData.overview}
    </div>
  </div>
);

// Functional component to render movie cards in app
export default function MovieCards() {
  const [userData, setUserData] = useState([]);
  const [movieData, setMovieData] = useState([]);

  /*   const initMovieData = require("../initData/initMovieData.json"); */

  const userId = '6369d823852305533b133048';

  // Method to fetch user data from database
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
      console.log(userData);
    }

    getUserData();

    return;
  }, [movieData.length]);

  // Initialize movie list for new users
  /*   if (typeof userData.movieData === "undefined" || userData.movieData.length === 0) {
      userData.movieData = initMovieData;
      updateUserDB(userData._id);
    } */

  // Method to update user data in server
  // This will send a post request to update the data in the database.
  async function updateUserDB(id) {
    console.log(userData);
    const updatedUser = userData;

    await fetch(`http://localhost:5000/update/${id}`, {
      method: "POST",
      body: JSON.stringify(updatedUser),
      headers: {
        'Content-Type': 'application/json'
      },
    });

  }

  // TODO Method to toggle viewed status and update user data
  async function toggleViewed(id) {
    console.log(id);
    const checked = userData.movieData.find(movie => movie.id === id).checked;
    const toggleCheck = !checked;
    userData.movieData.find(movie => movie.id === id).checked = toggleCheck;
    setUserData(userData);
    await updateUserDB(userData._id);
  }

  // TODO Method to toggle favorite and update user data
  async function toggleFavorite(id) {
    console.log(id);
    const favorite = userData.movieData.find(movie => movie.id === id).favorite;
    const toggleFavorite = !favorite;
    userData.movieData.find(movie => movie.id === id).favorite = toggleFavorite;
    setUserData(userData);
    await updateUserDB(userData._id);
  }

  // This method will delete a movie entry
  async function deleteMovie(id) {
    const newMovieData = userData.movieData.filter((movies) => movies.id !== id);
    userData.movieData = newMovieData;
    await updateUserDB(userData._id);

    setUserData(userData);
    setMovieData(newMovieData);
    console.log(userData);
  }

  // Method to map out movie data & populate metadata for each movie card
  function movieCards() {
    console.log(userData.movieData);
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

  // Displays the movie cards
  return (
    <div id='movieCardsContainer'>
      {movieCards()}
    </div>
  );
}