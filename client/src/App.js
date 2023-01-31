import React from 'react';
import { Route, Routes } from "react-router-dom";

import LoginForm from './components/LogInForm';
import RegistrationForm from './components/Registration';
import MovieCards from './components/MovieCard';

function App() {
  // App render
  return (
    <>
      <div id='page'>
        <div id="bgWrap"></div>
        <Routes>
          {/*           <Route exact path="/" element={<LoginForm />} />
          <Route exact path="/" element={<RegistrationForm />} /> */}
          <Route exact path="/" element={<MovieCards />} />
        </Routes>
      </div>
    </>
  );
}

export default App;