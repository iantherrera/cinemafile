import React from "react";
import updateUserDB from "./UpdateUserDB";

// Movie list reset button
export default function ResetButton({ isListView, setIsListView, userData, setUserData, setMovieData }) {
    return (
        <button id="resetButton" className="navButton" type="button"
            onClick={() => {
                ResetList({ isListView, setIsListView, userData, setUserData, setMovieData });
            }}
        >
            Reset List
        </button>
    )
}

// Reset movie list
async function ResetList({ isListView, setIsListView, userData, setUserData, setMovieData }) {
    const initMovieData = require("../initData/initMovieData.json");

    // Remove list view class from elements and return to default gallery view
    const contentContainer = document.querySelector(".contentContainer");
    if (contentContainer.id === "listViewContainer") {
        const movieListContainers = document.querySelectorAll("#listViewContainer *");
        for (let i = 0; i < movieListContainers.length; i++) {
            movieListContainers[i].classList.remove("listContainer");
        }
        const movieListContainer = document.getElementById("listViewContainer");
        movieListContainer.removeAttribute("id");
        movieListContainer.setAttribute("id", "movieCardsContainer");
        const viewButton = document.getElementById("viewButton");
        isListView = false;
        setIsListView(isListView);
        viewButton.innerHTML = "listview";
    }
    // Reset checkboxes with reset
    const checkboxes = document.querySelectorAll(".checkbox");
    for (let i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = false;
    }

    userData.movieData = initMovieData;
    await updateUserDB({ userData });
    setUserData(userData);
    setMovieData(userData.movieData);
}