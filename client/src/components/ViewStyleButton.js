import React, { useState } from "react";

// View style button
export default function viewStyleButton({ isListView, setIsListView }) {
    return (
        <button id="viewButton" className="navButton" type="button"
            onClick={() => {
                const currentListView = !isListView;
                setIsListView(isListView => !isListView);
                if (currentListView) {
                    const movieListContainers = document.querySelectorAll("#movieCardsContainer *");
                    for (let i = 0; i < movieListContainers.length; i++) {
                        movieListContainers[i].classList.add("listContainer");
                    }
                } else {
                    const movieListContainers = document.querySelectorAll("#listViewContainer *");
                    for (let i = 0; i < movieListContainers.length; i++) {
                        movieListContainers[i].classList.remove("listContainer");
                    }
                }
            }}
        >
            {isListView ? "gallery" : "listview"}
        </button>
    )
}