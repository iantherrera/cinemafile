import React from "react";
import { Link } from "react-router-dom";

import { useAuth } from "./auth/AuthContext";
import LogoutButton from "./pages/MovieCards/LogoutButton";
import ResetButton from './pages/MovieCards/ResetButton';
import ViewStyleButton from './pages/MovieCards/ViewStyleButton';

// Title header and menu bar. The nav depends on whether anyone is signed in,
// which now comes from the session rather than being assumed.
export default function Header({ isListView, setIsListView, onReset }) {
    const { user } = useAuth();

    return (
        <header>
            <div id="siteTitleContainer">
                <h1 id="siteTitle">cinemafile</h1>
            </div>
            <nav>
                {user ? (
                    <>
                        <ViewStyleButton isListView={isListView} setIsListView={setIsListView} />
                        <ResetButton onReset={onReset} />
                        <LogoutButton />
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
