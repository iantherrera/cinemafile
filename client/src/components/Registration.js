import React from "react";
import Header from "./Header";

function handleSubmit(e) {
    e.preventDefault();
    /* console.log(value); */
}

const RegistrationForm = () => {
    return (
        <>
            <Header />
            <div id="registrationFormContainer">
                <form id="registrationForm" onSubmit={handleSubmit}>
                    <div className="registrationInputContainer">
                        <label id="usernameLabel" for="username">Username: </label>
                        <input type="text" name="username" id="username" required />
                        {/* {renderErrorMessage("userName")} */}
                    </div>
                    <div className="registrationInputContainer">
                        <label for="firstPassword">Password: </label>
                        <input type="text" name="firstPassword" id="firstPassword" required />
                        {/* {renderErrorMessage("password")} */}
                    </div>
                    <div className="registrationInputContainer">
                        <label for="secondPassword">Confirm Password: </label>
                        <input type="text" name="secondPassword" id="secondPassword" required />
                        {/* {renderErrorMessage("password")} */}
                    </div>
                    <div>
                        <button className="navButton" type="submit">Register</button>
                    </div>
                </form>
            </div>
        </>
    )
};

export default RegistrationForm;