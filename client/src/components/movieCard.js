import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const tmdbKey = "11039f14945ee0f2e0036d42b77c687b"
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
      <div className='viewedCheckContainer'>viewed</div>
      <div className='favoriteButton'>favorite</div>
      <div className='deleteCardContainer'>delete</div>
    </div>
    <div className='rankTitleYearContainer'>
      <div className="movieRank">{props.metaData.rank}</div>
      <div className='movieTitleYearContainer'>
        <div className='movieTitle'>{props.metaData.movieTitle}</div>
        <div className='movieYear'>2022</div>
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

  const initMovieData = require("../initData/initMovieData.json");

  // Method to fetch user data from database
  useEffect(() => {
    async function getUserData() {
      const response = await fetch(`http://localhost:5000/userData/`);

      if (!response.ok) {
        const message = `An error occurred: ${response.statusText}`;
        window.alert(message);
        return;
      }

      const userData = await response.json();

      setUserData(userData);
    }
    getUserData();

    return;
  }, [userData.movieData])

  // Initialize movie list for new users
  if (typeof userData.movieData == "undefined") {
    userData.movieData = initMovieData;

    userData.movieData.map((setChecked) =>
      setChecked.checked = false)
    userData.movieData.map((setFavorite) =>
      setFavorite.favorite = false)

    addData();

    // Method to populate metadata from external tmdb API for each ID in initialized list
    async function addData() {
      for (let i = 0; i < initMovieData.length; i++) {
        const response = await fetch(`https://api.themoviedb.org/3/movie/${initMovieData[i].imdbId}?api_key=${tmdbKey}&language=en-US`);

        if (!response.ok) {
          const message = `An error occurred: ${response.statusText}`;
          window.alert(message);
          return;
        }

        const metaData = await response.json();

        userData.movieData[i].movieTitle = metaData.title;
        userData.movieData[i].posterPath = metaData.poster_path;
        userData.movieData[i].overview = metaData.overview;
      }
    }

    setUserData(userData);
  }

  // TODO Method to toggle viewed status and update user data

  // TODO Method to toggle favorite and update user data


  // This method will delete a movie entry
  async function deleteMovie(id) {
    await fetch(`http://localhost:5000/${id}`, {
      method: "DELETE"
    });

    const newUserData = userData.movieData.filter((el) => el._id !== id);
    setUserData(newUserData);
  }

  // Method to map out movie data & populate metadata for each movie card
  function movieCards() {
    const movieMetaData = userData.movieData;
    return movieMetaData.map((metaData, index) => {
      return (
        <MovieCard
          metaData={metaData}
          /*           viewed={viewed}
                    favorite={favorite} */
          deleteMovie={() => deleteMovie(userData.movieData.rank)}
          key={index}
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