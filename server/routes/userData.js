const express = require("express");
const { ObjectId } = require("mongodb");

const dbObj = require("../db/conn");

const userDataRoutes = express.Router();

const COLLECTION = "userData";

// Credential material must never leave the server. Applied to every read of a
// user document.
const WITHOUT_CREDENTIALS = { hash: 0, salt: 0 };

// Returns the collection, or null after responding 503 if the database is not
// connected yet. getDb() is undefined until connectToServer resolves.
function getCollection(res) {
    const db = dbObj.getDb();
    if (!db) {
        res.status(503).json({ error: "Database unavailable" });
        return null;
    }
    return db.collection(COLLECTION);
}

// The id comes from the signed-in session, never from the URL. Taking it from
// the request would let anyone read or overwrite another account's list just
// by changing the path.
function requireSession(req, res) {
    if (!req.session || !req.session.userId) {
        res.status(401).json({ error: "Not signed in" });
        return null;
    }
    return new ObjectId(req.session.userId);
}

// Read the signed-in user's movie list.
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
        // Report the failure instead of throwing out of an async handler,
        // which would take the process down.
        console.error("GET /userData failed:", err);
        res.status(500).json({ error: "Could not load user data" });
    }
});

// Replace the signed-in user's movie list.
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

module.exports = userDataRoutes;
