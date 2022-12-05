import React from "react";

import ResetButton from './ResetButton';
import ViewStyleButton from './ViewStyleButton';

// Title header and menu bar
export default function Header({ isListView, setIsListView, userData, setUserData, setMovieData }) {
    return (
        <header>
            <div id="siteTitleContainer">
                <h1 id="siteTitle">cinefile</h1>
            </div>
            <nav>
                <ViewStyleButton isListView={isListView} setIsListView={setIsListView} />
                <ResetButton isListView={isListView} setIsListView={setIsListView} userData={userData} setUserData={setUserData} setMovieData={setMovieData} />
            </nav>
        </header>
    )
}