import React from "react";

export default function LogoutButton({ loggedIn, setLoggedIn }) {
    return (
        <button className="navButton" id="LogoutButton" type="button"
            onClick={() => {
                loggedIn = false;
                setLoggedIn(loggedIn);
            }}>
            Logout
        </button>
    )
}