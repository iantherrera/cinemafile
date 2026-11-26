const express = require("express");
const { ObjectId } = require("mongodb");
const dbObj = require("../db/conn");

const userDataRoutes = express.Router();

const COLLECTION = "userData";

// Credential material must never leave the server. Applied to every read of a
// user document.
const WITHOUT_CREDENTIALS = { password: 0, hash: 0, salt: 0 };

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

// Mongo document ids are 24 hex characters. Matching that form directly rather
// than calling ObjectId.isValid is deliberate: isValid's treatment of other
// shapes changed across driver versions. v4 accepted a 12-character string and
// quietly reinterpreted its bytes as a different id, while v6 rejects it. An
// explicit check behaves identically on both and never guesses.
const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

// Returns an ObjectId, or null after responding 400. A bare ObjectId() on
// arbitrary input throws, which previously crashed the request.
function parseId(req, res) {
    if (!OBJECT_ID.test(req.params.id)) {
        res.status(400).json({ error: "Invalid user id" });
        return null;
    }
    return new ObjectId(req.params.id);
}

// Get a single record by id, minus credential fields.
userDataRoutes.route("/userData/:id").get(async function (req, res) {
    const id = parseId(req, res);
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

// Update a user's movie list by id.
userDataRoutes.route("/update/:id").post(async function (req, res) {
    const id = parseId(req, res);
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
