const crypto = require("crypto");

const express = require("express");
const cors = require("cors");
const session = require("express-session");
// connect-mongo 6 exposes a named export under CommonJS; the module object
// itself has no .create.
const { MongoStore } = require("connect-mongo");

const { createLimiters } = require("./auth/rateLimit");

const DAY = 24 * 60 * 60;
const SESSION_DAYS = 14;

// The session cookie is httpOnly, so page scripts cannot read it. That is the
// reason for using a cookie rather than a token in localStorage: an XSS flaw
// can still act as the user while the page is open, but it cannot copy the
// credential out and reuse it later.
function sessionSecret() {
    const fromEnv = process.env.SESSION_SECRET;
    if (fromEnv) return fromEnv;

    if (process.env.NODE_ENV === "production") {
        throw new Error("SESSION_SECRET must be set in production");
    }

    // Development convenience. Regenerating per start means restarting the
    // server signs everyone out, which is a fair trade for not shipping a
    // default secret that someone forgets to replace.
    console.warn("SESSION_SECRET is not set; generating a temporary one. Sessions will not survive a restart.");
    return crypto.randomBytes(32).toString("hex");
}

function createApp(options = {}) {
    const clientOrigin = options.clientOrigin || process.env.CLIENT_ORIGIN || "http://localhost:3000";
    const mongoUrl = options.mongoUrl || process.env.ATLAS_URI;

    const app = express();

    // Behind a reverse proxy every request arrives from the proxy, so req.ip
    // would be the same for everyone and the per-IP rate limits would behave
    // as one global limit. Setting this tells Express how many hops to trust
    // when reading X-Forwarded-For.
    //
    // It is opt-in and takes a hop count or a subnet rather than defaulting to
    // true, because trusting the header unconditionally lets a client forge
    // its own address and step around the very limits below.
    const trustProxy = options.trustProxy ?? process.env.TRUST_PROXY;
    if (trustProxy !== undefined && trustProxy !== "") {
        const hops = Number(trustProxy);
        app.set("trust proxy", Number.isFinite(hops) ? hops : trustProxy);
    }

    // credentials: true is what allows the browser to send the session cookie
    // on a cross-origin request, and it requires an explicit origin -- the
    // wildcard is rejected by browsers once credentials are involved.
    app.use(cors({ origin: clientOrigin, credentials: true }));
    app.use(express.json());

    app.use(
        session({
            name: "cinemafile.sid",
            secret: sessionSecret(),
            resave: false,
            // Do not issue a cookie to visitors who never sign in.
            saveUninitialized: false,
            store: MongoStore.create({
                mongoUrl,
                dbName: "cinefile",
                collectionName: "sessions",
                ttl: SESSION_DAYS * DAY,
            }),
            cookie: {
                httpOnly: true,
                // localhost:3000 and localhost:5000 are the same site despite
                // the different ports, so lax still sends the cookie. Serving
                // the client from another domain in production means sameSite
                // "none" plus secure: true.
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
                maxAge: SESSION_DAYS * DAY * 1000,
            },
        })
    );

    // Applied before the router so a blocked request never reaches scrypt,
    // which is the expensive part an attacker would otherwise be spending the
    // server's CPU on.
    const limiters = createLimiters(options.rateLimits);
    app.use("/auth/login", limiters.login);
    app.use("/auth/register", limiters.register);

    app.use(require("./routes/auth"));
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

    return app;
}

module.exports = { createApp };
