import React from "react";

import LogoutButton from "./pages/MovieCards/LogoutButton";
import ResetButton from './pages/MovieCards/ResetButton';
import ViewStyleButton from './pages/MovieCards/ViewStyleButton';

// Title header and menu bar
// TODO: loggedIn is forced true until login exists, so the logged-out branch
// below is unreachable and LogoutButton has no session to clear.
export default function Header({ loggedIn, setLoggedIn, isListView, setIsListView, onReset }) {
    loggedIn = true;

    if (loggedIn) {
        return (
            <header>
                <div id="siteTitleContainer">
                    <h1 id="siteTitle">cinemafile</h1>
                </div>
                <nav>
                    <ViewStyleButton isListView={isListView} setIsListView={setIsListView} />
                    <ResetButton onReset={onReset} />
                    <LogoutButton loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
                </nav>
            </header>
        )
    };

    return (
        <header>
            <div id="siteTitleContainer">
                <h1 id="siteTitle">cinemafile</h1>
            </div>
            <nav>
                <button className="navButton">Register</button>
            </nav>
        </header>
    )
}
