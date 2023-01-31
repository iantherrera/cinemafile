import React, { useEffect, useState } from "react";
import Header from "./Header";

function handleSubmit(e) {
    e.preventDefault();
    /* console.log(value); */
}

export default function LoginForm() {

    return (
        <>
            <Header />
            <div id="loginFormContainer">
                <form id="loginForm" onSubmit={handleSubmit}>
                    <div className="loginInputContainer">
                        <label id="usernameLabel" for="username">Username: </label>
                        <input type="text" name="username" id="username" required />
                        {/* {renderErrorMessage("userName")} */}
                    </div>
                    <div className="loginInputContainer">
                        <label for="current-password">Password: </label>
                        <input type="password" name="current-password" id="password" required />
                        {/* {renderErrorMessage("password")} */}
                    </div>
                    <div>
                        <button className="navButton" type="submit">Login</button>
                    </div>
                </form>
            </div>
        </>
    )
};