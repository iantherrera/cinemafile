const express = require("express");
const { ObjectId } = require("mongodb");

const dbObj = require("../db/conn");
const { hashPassword, verifyPassword, validatePassword, ABSENT_USER } = require("../auth/password");
const { SESSION_COOKIE_NAME } = require("../auth/session");
const { defaultMovieList } = require("../initData/defaultMovieList");

const authRoutes = express.Router();

const COLLECTION = "userData";

// Usernames are stored lowercased so that "Ian" and "ian" are one account.
const USERNAME = /^[a-z0-9_.-]{3,30}$/;

function normalizeUserName(value) {
    return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function getCollection(res) {
    const db = dbObj.getDb();
    if (!db) {
        res.status(503).json({ error: "Database unavailable" });
        return null;
    }
    return db.collection(COLLECTION);
}

// Never the hash or the salt.
function publicUser(user) {
    return { id: user._id.toString(), userName: user.userName };
}

// Session fixation defence: an id issued before sign-in must not become the
// authenticated one, or whoever planted it is now signed in as the victim.
function startSession(req, user) {
    return new Promise((resolve, reject) => {
        req.session.regenerate((err) => {
            if (err) return reject(err);
            req.session.userId = user._id.toString();
            req.session.save((saveErr) => (saveErr ? reject(saveErr) : resolve()));
        });
    });
}

authRoutes.post("/auth/register", async (req, res) => {
    const { userName: rawName, password } = req.body ?? {};
    const userName = normalizeUserName(rawName);

    if (!USERNAME.test(userName)) {
        return res.status(400).json({
            error: "Username must be 3-30 characters, using letters, numbers, dot, dash or underscore",
        });
    }

    const passwordProblem = validatePassword(password);
    if (passwordProblem) {
        return res.status(400).json({ error: passwordProblem });
    }

    const collection = getCollection(res);
    if (!collection) return;

    try {
        const { hash, salt } = await hashPassword(password);

        const result = await collection.insertOne({
            userName,
            hash,
            salt,
            movieData: defaultMovieList(),
            createdAt: new Date(),
        });

        const user = { _id: result.insertedId, userName };
        await startSession(req, user);

        res.status(201).json({ user: publicUser(user) });
    } catch (err) {
        // The unique index is what prevents duplicates; checking first would
        // race the insert.
        if (err && err.code === 11000) {
            return res.status(409).json({ error: "That username is taken" });
        }
        console.error("POST /auth/register failed:", err);
        res.status(500).json({ error: "Could not create your account" });
    }
});

authRoutes.post("/auth/login", async (req, res) => {
    const { userName: rawName, password } = req.body ?? {};
    const userName = normalizeUserName(rawName);

    const collection = getCollection(res);
    if (!collection) return;

    try {
        const user = await collection.findOne({ userName });

        // Always hash, even with no match: short-circuiting here would answer
        // an unknown username far faster than a real one, and that gap
        // enumerates accounts no matter how uniform the message is.
        const { hash, salt } = user ?? ABSENT_USER;
        const passwordMatches = await verifyPassword(password, hash, salt);

        if (!user || !passwordMatches) {
            return res.status(401).json({ error: "Incorrect username or password" });
        }

        await startSession(req, user);
        res.json({ user: publicUser(user) });
    } catch (err) {
        console.error("POST /auth/login failed:", err);
        res.status(500).json({ error: "Could not sign you in" });
    }
});

authRoutes.post("/auth/logout", (req, res) => {
    if (!req.session) {
        return res.status(204).end();
    }

    req.session.destroy((err) => {
        if (err) {
            console.error("POST /auth/logout failed:", err);
            return res.status(500).json({ error: "Could not sign you out" });
        }
        res.clearCookie(SESSION_COOKIE_NAME);
        res.status(204).end();
    });
});

// Lets the client restore its view on load without keeping session state
// anywhere page scripts can read.
authRoutes.get("/auth/me", async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: "Not signed in" });
    }

    const collection = getCollection(res);
    if (!collection) return;

    try {
        const user = await collection.findOne(
            { _id: new ObjectId(req.session.userId) },
            { projection: { userName: 1 } }
        );

        // The account was deleted while the session was still alive.
        if (!user) {
            return req.session.destroy(() => res.status(401).json({ error: "Not signed in" }));
        }

        res.json({ user: publicUser(user) });
    } catch (err) {
        console.error("GET /auth/me failed:", err);
        res.status(500).json({ error: "Could not load your account" });
    }
});

module.exports = authRoutes;
