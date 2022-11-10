import React, { useState } from "react";
import { useNavigate } from "react-router";

// Login form
function LogInForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (event) => {
        // Prevent page reload
        event.preventDefault();
        let { username, password } = document.forms[0];
        setUsername(username);
        setPassword(password);
        console.log(username);
    };

    const renderErrorMessage = (name) =>
        name === errorMessages.name && (
            <div className="error">{errorMessages.message}</div>
        );

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label for="username">Username: </label>
                <input type="text" name="username" id="username" required />
                {renderErrorMessage("userName")}
            </div>
            <div>
                <label for="current-password">Password: </label>
                <input type="password" name="current-password" id="current-password" required />
                {renderErrorMessage("password")}
            </div>
            <div>
                <input type="submit" value="Submit" />
            </div>
        </form>
    );
}
