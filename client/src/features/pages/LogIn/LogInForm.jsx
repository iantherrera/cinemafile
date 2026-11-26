import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Header from "../../Header";
import { useAuth } from "../../auth/AuthContext";

export default function LoginForm() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        if (submitting) return;

        setError(null);
        setSubmitting(true);

        try {
            await login(userName, password);
            navigate("/", { replace: true });
        } catch (err) {
            setError(err.message);
            setSubmitting(false);
        }
    }

    return (
        <div id="page">
            <Header />
            <div id="bgWrap"></div>
            <div id="loginFormContainer">
                <form id="loginForm" onSubmit={handleSubmit}>
                    {error && <div className="errorMessage" role="alert">{error}</div>}

                    <div className="loginInputContainer">
                        <label id="usernameLabel" htmlFor="username">Username: </label>
                        <input
                            type="text"
                            name="username"
                            id="username"
                            autoComplete="username"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="loginInputContainer">
                        <label htmlFor="password">Password: </label>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <button className="navButton" type="submit" disabled={submitting}>
                            {submitting ? "Signing in..." : "Login"}
                        </button>
                    </div>

                    <p className="formFooter">
                        No account? <Link to="/register">Register</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
