import React from "react";

// Toggles between gallery and list view. The container's id is derived from
// isListView, and the list styles hang off that id, so there is nothing to
// change in the DOM by hand.
export default function ViewStyleButton({ isListView, setIsListView }) {
    return (
        <button id="viewButton" className="navButton" type="button"
            onClick={() => setIsListView((current) => !current)}
        >
            {isListView ? "Gallery" : "Listview"}
        </button>
    )
}
