const crypto = require("crypto");

const express = require("express");
const cors = require("cors");
const session = require("express-session");
// connect-mongo 6 exposes a named export under CommonJS; the module object
// itself has no .create.
const { MongoStore } = require("connect-mongo");

const { createLimiters } = require("./auth/rateLimit");
const { SESSION_COOKIE_NAME } = require("./auth/session");

const DAY = 24 * 60 * 60;
const SESSION_DAYS = 14;

function sessionSecret() {
    const fromEnv = process.env.SESSION_SECRET;
    if (fromEnv) return fromEnv;

    if (process.env.NODE_ENV === "production") {
        throw new Error("SESSION_SECRET must be set in production");
    }

    // Generating beats shipping a default secret someone forgets to replace.
    console.warn("SESSION_SECRET is not set; generating a temporary one. Sessions will not survive a restart.");
    return crypto.randomBytes(32).toString("hex");
}

function createApp(options = {}) {
    const clientOrigin = options.clientOrigin || process.env.CLIENT_ORIGIN || "http://localhost:3000";
    const mongoUrl = options.mongoUrl || process.env.ATLAS_URI;

    // Checked before the store is built. connect-mongo would otherwise throw
    // "You must provide either mongoUrl|clientPromise|client in options",
    // which is the first thing anyone sees who clones this and runs it before
    // creating config.env.
    if (!mongoUrl) {
        throw new Error(
            "ATLAS_URI is not set. Copy server/config.env.example to server/config.env and fill it in."
        );
    }

    const app = express();

    // Behind a proxy every request appears to come from the proxy, collapsing
    // the per-IP limits into one global limit. Takes a hop count or subnet
    // rather than true: trusting X-Forwarded-For unconditionally lets a client
    // forge its address and step around those limits.
    const trustProxy = options.trustProxy ?? process.env.TRUST_PROXY;
    if (trustProxy !== undefined && trustProxy !== "") {
        const hops = Number(trustProxy);
        app.set("trust proxy", Number.isFinite(hops) ? hops : trustProxy);
    }

    // credentials: true requires an explicit origin -- browsers reject the
    // wildcard once credentials are involved.
    app.use(cors({ origin: clientOrigin, credentials: true }));
    app.use(express.json());

    app.use(
        session({
            name: SESSION_COOKIE_NAME,
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
                // Different ports are still the same site, so lax sends the
                // cookie. A client on another domain needs "none" + secure.
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
                maxAge: SESSION_DAYS * DAY * 1000,
            },
        })
    );

    // Before the router, so a blocked request never reaches scrypt.
    const limiters = createLimiters(options.rateLimits);
    app.use("/auth/login", limiters.login);
    app.use("/auth/register", limiters.register);

    app.use(require("./routes/auth"));
    app.use(require("./routes/userData"));

    app.use((req, res) => {
        res.status(404).json({ error: "Not found" });
    });

    // Four arguments, so Express treats this as the error handler.
    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
        // express.json() rejects a malformed body with status 400 and
        // expose: true. Passing that through keeps a caller's typo out of the
        // 500s, which should mean the server itself broke, and out of the
        // error log along with it.
        const status = Number(err.status || err.statusCode) || 500;

        if (status >= 500) {
            console.error("Unhandled error:", err);
            return res.status(500).json({ error: "Internal server error" });
        }

        res.status(status).json({ error: err.expose ? err.message : "Bad request" });
    });

    return app;
}

module.exports = { createApp };
