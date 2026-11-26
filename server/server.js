require("dotenv").config({ path: "./config.env" });

const dbObj = require("./db/conn");
const { createApp } = require("./app");

const port = process.env.PORT || 5000;
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:3000";

const app = createApp({ clientOrigin });

// Listen regardless of the database result: a failed connection leaves the
// routes answering 503 rather than leaving the port dead and silent.
app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
    console.log(`Accepting requests from: ${clientOrigin}`);
});

dbObj.connectToServer().catch((err) => {
    console.error("DATABASE UNAVAILABLE -- requests will return 503.");
    console.error(err.message);
});
