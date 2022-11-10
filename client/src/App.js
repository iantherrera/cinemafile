import React, { useState } from 'react';
import { Route, Routes } from "react-router-dom";

import MovieCards from './components/movieCard';


function App() {
  // App render
  return (
    <>
      <div id="bgWrap"></div>
      <header>
        <div id="pageTitleContainer" className='bubbleFrame'>
          <h1 id="pageTitle">cinefile</h1>
        </div>
        <nav id="nav">
          <ul id="navList">
            <li className='bubbleFrame'>listview</li>
            <li className='bubbleFrame'>LOGOUT</li>
          </ul>
        </nav>
      </header>
      <Routes>
        <Route exact path="/" element={<MovieCards />} />
      </Routes>
    </>
  );
}

export default App;