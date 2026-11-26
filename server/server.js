require("dotenv").config({ path: "./config.env" });

const dbObj = require("./db/conn");
const { createApp } = require("./app");

const port = process.env.PORT || 5000;
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:3000";

let app;
try {
    app = createApp({ clientOrigin });
} catch (err) {
    // Configuration is missing rather than wrong, so there is nothing to serve
    // and a stack trace would bury the one line that helps.
    console.error(err.message);
    process.exit(1);
}

// A database that is configured but unreachable still gets a listening server:
// the routes answer 503 and say so, which is easier to diagnose than a dead
// port. A database that is not configured at all exits above instead.
app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
    console.log(`Accepting requests from: ${clientOrigin}`);
});

dbObj.connectToServer().catch((err) => {
    console.error("DATABASE UNAVAILABLE -- requests will return 503.");
    console.error(err.message);
});
