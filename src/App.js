import React, { useState } from 'react';

function App() {
  // Global variables
  const tmdbKey = "11039f14945ee0f2e0036d42b77c687b";

  // State variables
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [errorMessages, setErrorMessages] = useState({});

  // Login form
  function LogInForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (event) => {
      // Prevent page reload
      event.preventDefault();
      let { username, password } = document.forms[0];
      setUsername(username);
      setPassword(password);
      console.log(username);
    };

    const renderErrorMessage = (name) =>
      name === errorMessages.name && (
        <div className="error">{errorMessages.message}</div>
      );

    return (
      <form onSubmit={handleSubmit}>
        <div>
          <label for="username">Username: </label>
          <input type="text" name="username" id="username" required />
          {renderErrorMessage("userName")}
        </div>
        <div>
          <label for="current-password">Password: </label>
          <input type="password" name="current-password" id="current-password" required />
          {renderErrorMessage("password")}
        </div>
        <div>
          <input type="submit" value="Submit" />
        </div>
      </form>
    );
  }

  // Initialize userlist for new users from local json file with imdb id's & movie ranks
  const movieIdRank = require("./movieIdRank.json");
  let userList = [];

  if (userList.length === 0) {
    userList = movieIdRank;
    userList.map((setChecked) =>
      setChecked.checked = false)
    userList.map((setFavorite) =>
      setFavorite.favorite = false)
    addData();
  }
  // Populate metadata from tmdb external API for each imdb id in initialized list
  async function addData() {
    for (let i = 0; i < userList.length; i++) {
      const res = await fetch(`https://api.themoviedb.org/3/movie/${userList[i].imdbId}?api_key=${tmdbKey}&language=en-US`);

      const movieData = await res.json();
      userList[i].movieTitle = movieData.title;
      userList[i].posterPath = movieData.poster_path;
      userList[i].overview = movieData.overview
    }
  }
  // Movie Card rendering component
  function MovieCards(props) {
    console.log(userList);
    const movieCard = props.userList.map((entry) =>
      <div key={entry.rank} className="movieCard">
        <div className='cardOptionsContainer'>
          <div className='viewedCheckContainer'>check</div>
          <div className='favoriteButton'>heart</div>
          <div className='deleteCardContainer'>trashcan</div>
        </div>
        <div className='rankTitleYearContainer'>
          <div className="movieRank">{entry.rank}</div>
          <div className='movieTitleYearContainer'>
            <div className='movieTitle'>{entry.movieTitle}</div>
            <div className='movieYear'>2022</div>
          </div>
        </div>
        <div className='moviePosterContainer'>
          <img src={`https://image.tmdb.org/t/p/original/${entry.posterPath}`} alt="Movie poster image" className='posterImg' />
        </div>
        <div className='movieSynopsis'>
          {entry.overview}
        </div>
      </div>
    );
    return (
      <div id='movieCardsContainer'>
        {movieCard}
      </div>
    );
  }
  // App render
  return (
    <>
      <div id="bgWrap"></div>
      <header>
        <div id="pageTitleContainer">
          <h1 id="pageTitle">cinefile</h1>
        </div>
        <nav id="nav">
          <ul id="navList">
            <li>Login</li>
            <li>Register</li>
          </ul>
        </nav>
      </header>
      <MovieCards userList={userList} />
    </>
  );
}

export default App;