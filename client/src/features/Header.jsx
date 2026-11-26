import React from "react";
import { Link } from "react-router-dom";

import { useAuth } from "./auth/AuthContext";
import LogoutButton from "./pages/MovieCards/LogoutButton";
import ResetButton from './pages/MovieCards/ResetButton';
import ViewStyleButton from './pages/MovieCards/ViewStyleButton';

export default function Header({ isListView, setIsListView, onReset }) {
    const { user } = useAuth();

    return (
        <header>
            <h1 id="siteTitle">cinemafile</h1>
            <nav>
                {user ? (
                    <>
                        <ViewStyleButton isListView={isListView} setIsListView={setIsListView} />
                        <ResetButton onReset={onReset} />
                        <LogoutButton />
                        <span className="userChip">
                            <span className="userAvatar" aria-hidden="true">
                                {user.userName.charAt(0).toUpperCase()}
                            </span>
                            <span className="visuallyHidden">Signed in as </span>
                            <span className="userName">{user.userName}</span>
                        </span>
                    </>
                ) : (
                    <>
                        <Link className="navButton" to="/login">Login</Link>
                        <Link className="navButton" to="/register">Register</Link>
                    </>
                )}
            </nav>
        </header>
    );
}
