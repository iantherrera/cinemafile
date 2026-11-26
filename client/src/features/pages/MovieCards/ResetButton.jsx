import React from "react";

export default function ResetButton({ onReset }) {
    return (
        <button id="resetButton" className="navButton" type="button"
            onClick={onReset}
        >
            Reset List
        </button>
    )
}
