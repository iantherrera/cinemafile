import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Header from "../../Header";
import { useAuth } from "../../auth/AuthContext";

// Kept in step with validatePassword on the server. The server is the one that
// decides; this only saves a round trip and gives a faster answer.
const MIN_PASSWORD_LENGTH = 8;

export default function RegistrationForm() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        if (submitting) return;

        if (password !== confirmPassword) {
            setError("Those passwords do not match");
            return;
        }
        if (password.length < MIN_PASSWORD_LENGTH) {
            setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
            return;
        }

        setError(null);
        setSubmitting(true);

        try {
            await register(userName, password);
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
            <div id="registrationFormContainer">
                <form id="registrationForm" onSubmit={handleSubmit}>
                    <div className="formHeading">
                        <h2 className="formTitle">Create an account</h2>
                        <p className="formLede">You start with the full AFI top 100.</p>
                    </div>

                    {error && <div className="errorMessage" role="alert">{error}</div>}

                    <div className="registrationInputContainer">
                        <label id="usernameLabel" htmlFor="username">Username</label>
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

                    <div className="registrationInputContainer">
                        <label htmlFor="firstPassword">Password</label>
                        <input
                            type="password"
                            name="firstPassword"
                            id="firstPassword"
                            autoComplete="new-password"
                            minLength={MIN_PASSWORD_LENGTH}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="registrationInputContainer">
                        <label htmlFor="secondPassword">Confirm password</label>
                        <input
                            type="password"
                            name="secondPassword"
                            id="secondPassword"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="formActions">
                        <button className="navButton primary" type="submit" disabled={submitting}>
                            {submitting ? "Creating..." : "Register"}
                        </button>
                    </div>

                    <p className="formFooter">
                        Already registered? <Link to="/login">Login</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
