import React from 'react';
import { Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider, useAuth } from './features/auth/AuthContext';
import LoginForm from './features/pages/LogIn/LogInForm';
import RegistrationForm from './features/pages/Registration/Registration';
import MovieCards from './features/pages/MovieCards/MovieCard';

// Until the session check finishes we know nothing, so render neither the
// protected page nor a redirect to the login page -- either would be a guess,
// and the wrong one flashes the login form at a signed-in user.
function Pending() {
  return <div id="page"><div id="bgWrap"></div></div>;
}

function RequireAuth({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <Pending />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// The mirror image: someone who is already signed in has no use for the login
// or registration page.
function RequireAnonymous({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <Pending />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<RequireAnonymous><LoginForm /></RequireAnonymous>} />
        <Route path="/register" element={<RequireAnonymous><RegistrationForm /></RequireAnonymous>} />
        <Route path="/" element={<RequireAuth><MovieCards /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
