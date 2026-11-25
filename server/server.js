const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: "./config.env" });

const dbObj = require("./db/conn");

const app = express();
const port = process.env.PORT || 5000;

// Only the client origin may call this API. Previously cors() allowed every
// origin on the internet.
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:3000";

app.use(cors({ origin: clientOrigin }));
app.use(express.json());
app.use(require("./routes/userData"));

// Unmatched routes.
app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

// Last-resort handler so a throw in a route cannot take the process down.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});

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
