import React from "react";

export default function ViewStyleButton({ isListView, setIsListView }) {
    return (
        <button id="viewButton" className="navButton" type="button"
            onClick={() => setIsListView((current) => !current)}
        >
            {isListView ? "Gallery" : "Listview"}
        </button>
    )
}
