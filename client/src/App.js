import React from 'react';
import { Route, Routes } from "react-router-dom";

import MovieCards from './components/movieCard';



function App() {
  // App render
  return (
    <>
      <Routes>
        <Route exact path="/" element={<MovieCards />} />
      </Routes>
    </>
  );
}

export default App;