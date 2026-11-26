const express = require("express");
const { ObjectId } = require("mongodb");

const dbObj = require("../db/conn");
const { defaultMovieList } = require("../initData/defaultMovieList");

const userDataRoutes = express.Router();

const COLLECTION = "userData";

const WITHOUT_CREDENTIALS = { hash: 0, salt: 0 };

// getDb() is undefined until connectToServer resolves, hence the 503.
function getCollection(res) {
    const db = dbObj.getDb();
    if (!db) {
        res.status(503).json({ error: "Database unavailable" });
        return null;
    }
    return db.collection(COLLECTION);
}

// From the session, never the URL: taking it from the request would let
// anyone read or overwrite another account's list by editing the path.
function requireSession(req, res) {
    if (!req.session || !req.session.userId) {
        res.status(401).json({ error: "Not signed in" });
        return null;
    }
    return new ObjectId(req.session.userId);
}

userDataRoutes.route("/userData").get(async function (req, res) {
    const id = requireSession(req, res);
    if (!id) return;

    const collection = getCollection(res);
    if (!collection) return;

    try {
        const user = await collection.findOne(
            { _id: id },
            { projection: WITHOUT_CREDENTIALS }
        );

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user);
    } catch (err) {
        // Throwing out of an async handler would take the process down.
        console.error("GET /userData failed:", err);
        res.status(500).json({ error: "Could not load user data" });
    }
});

userDataRoutes.route("/update").post(async function (req, res) {
    const id = requireSession(req, res);
    if (!id) return;

    const { movieData } = req.body ?? {};
    if (!Array.isArray(movieData)) {
        return res.status(400).json({ error: "movieData must be an array" });
    }

    const collection = getCollection(res);
    if (!collection) return;

    try {
        const result = await collection.updateOne(
            { _id: id },
            { $set: { movieData } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount,
        });
    } catch (err) {
        console.error("POST /update failed:", err);
        res.status(500).json({ error: "Could not save changes" });
    }
});

// Returns the restored list so the client need not keep its own copy.
userDataRoutes.route("/reset").post(async function (req, res) {
    const id = requireSession(req, res);
    if (!id) return;

    const collection = getCollection(res);
    if (!collection) return;

    try {
        const movieData = defaultMovieList();
        const result = await collection.updateOne({ _id: id }, { $set: { movieData } });

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ movieData });
    } catch (err) {
        console.error("POST /reset failed:", err);
        res.status(500).json({ error: "Could not reset your list" });
    }
});

module.exports = userDataRoutes;
