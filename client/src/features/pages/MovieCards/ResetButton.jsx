import React from "react";

// Restores the user's list to the default AFI top 100. The work happens in
// MovieCards, which owns the list.
export default function ResetButton({ onReset }) {
    return (
        <button id="resetButton" className="navButton" type="button"
            onClick={onReset}
        >
            Reset List
        </button>
    )
}
