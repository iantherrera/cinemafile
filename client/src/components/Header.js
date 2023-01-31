import React from "react";

import LogoutButton from "./LogoutButton";
import ResetButton from './ResetButton';
import ViewStyleButton from './ViewStyleButton';

// Title header and menu bar
export default function Header({ loggedIn, setLoggedIn, isListView, setIsListView, userData, setUserData, setMovieData }) {
    loggedIn = true;

    if (loggedIn) {
        return (
            <header>
                <div id="siteTitleContainer">
                    <h1 id="siteTitle">cinefile</h1>
                </div>
                <nav>
                    <ViewStyleButton isListView={isListView} setIsListView={setIsListView} />
                    <ResetButton isListView={isListView} setIsListView={setIsListView} userData={userData} setUserData={setUserData} setMovieData={setMovieData} />
                    <LogoutButton loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
                </nav>
            </header>
        )
    };

    return (
        <header>
            <div id="siteTitleContainer">
                <h1 id="siteTitle">cinefile</h1>
            </div>
            <nav>
                <button className="navButton">Register</button>
            </nav>
        </header>
    )
}