import React from 'react';
import { Route, Routes } from "react-router-dom";

import LoginForm from './features/pages/LogIn/LogInForm';
import RegistrationForm from './features/pages/Registration/Registration';
import MovieCards from './features/pages/MovieCards/MovieCard';

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