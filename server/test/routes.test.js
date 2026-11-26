// Integration tests for the userData routes.
//
// These run against a real mongod started by mongodb-memory-server, using the
// real driver and the real db/conn.js, so they exercise actual database
// behaviour rather than a stub. That makes them the check that a driver
// upgrade has changed nothing: the suite should pass unchanged before and
// after.
//
// Run with: npm test   (from the server directory)

const http = require("http");
const express = require("express");
const { ObjectId } = require("mongodb");
const { MongoMemoryServer } = require("mongodb-memory-server");

const dbObj = require("../db/conn");

const PORT = 5099;
const USER_ID = "6369d823852305533b133048";
const OTHER_ID = "6369d823852305533b133099";

const CREDENTIALS = {
    password: "test-plaintext",
    hash: "test-hash",
    salt: "test-salt",
};

const SEED_MOVIES = [
    { imdbId: "tt0033467", movieTitle: "Citizen Kane", checked: false, favorite: false },
    { imdbId: "tt0068646", movieTitle: "The Godfather", checked: true, favorite: false },
];

let mongod;
let httpServer;
let collection;
const results = [];

function check(name, pass, detail) {
    results.push({ name, pass: !!pass, detail });
}

function request(method, path, body) {
    return new Promise((resolve, reject) => {
        const payload = body === undefined ? null : JSON.stringify(body);
        const headers = payload
            ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) }
            : {};

        const req = http.request({ host: "localhost", port: PORT, path, method, headers }, (res) => {
            let data = "";
            res.on("data", (chunk) => { data += chunk; });
            res.on("end", () => {
                let parsed = null;
                try { parsed = JSON.parse(data); } catch (err) { /* non-JSON body */ }
                resolve({ status: res.statusCode, body: parsed });
            });
        });

        req.on("error", reject);
        if (payload) req.write(payload);
        req.end();
    });
}

const get = (path) => request("GET", path);
const post = (path, body) => request("POST", path, body);

async function reseed() {
    await collection.deleteMany({});
    await collection.insertOne({
        _id: new ObjectId(USER_ID),
        userName: "user1",
        password: CREDENTIALS.password,
        hash: CREDENTIALS.hash,
        salt: CREDENTIALS.salt,
        movieData: SEED_MOVIES.map((m) => Object.assign({}, m)),
    });
}

async function setup() {
    mongod = await MongoMemoryServer.create();
    process.env.ATLAS_URI = mongod.getUri();

    const db = await dbObj.connectToServer();
    collection = db.collection("userData");

    const app = express();
    app.use(express.json());
    app.use(require("../routes/userData"));
    app.use((req, res) => res.status(404).json({ error: "Not found" }));

    await new Promise((resolve) => { httpServer = app.listen(PORT, resolve); });
}

async function teardown() {
    if (httpServer) await new Promise((resolve) => httpServer.close(resolve));
    await dbObj.closeConnection();
    if (mongod) await mongod.stop();
}

async function run() {
    await reseed();

    // --- reads ---
    let res = await get("/userData/" + USER_ID);
    check("GET existing user -> 200", res.status === 200, "got " + res.status);
    check("response carries movieData", Array.isArray(res.body && res.body.movieData));
    check(
        "movieData round-trips intact",
        res.body && res.body.movieData.length === 2 && res.body.movieData[0].movieTitle === "Citizen Kane",
        JSON.stringify(res.body && res.body.movieData)
    );

    const leaked = Object.keys(CREDENTIALS).filter((f) => res.body && f in res.body);
    check("no password, hash or salt in the response", leaked.length === 0, "leaked: " + leaked.join(", "));

    // The projection must hide those fields, not delete them.
    const stored = await collection.findOne({ _id: new ObjectId(USER_ID) });
    check(
        "credentials still present in the database",
        stored.password === CREDENTIALS.password && stored.hash === CREDENTIALS.hash && stored.salt === CREDENTIALS.salt,
        "projection should hide fields, not remove them"
    );

    res = await get("/userData/" + OTHER_ID);
    check("GET unknown user -> 404", res.status === 404, "got " + res.status);

    // --- id validation (v4 and v6 disagree about 12-character strings) ---
    const badIds = [
        ["12-char string", "123456789012"],
        ["11-char string", "12345678901"],
        ["23 hex chars", "6369d823852305533b13304"],
        ["non-hex", "zzzzzzzzzzzzzzzzzzzzzzzz"],
        ["encoded space", "%20"],
    ];
    for (const entry of badIds) {
        const r = await get("/userData/" + entry[1]);
        check("malformed id rejected: " + entry[0] + " -> 400", r.status === 400, "got " + r.status);
    }

    // --- writes ---
    const newList = [{ imdbId: "tt0033467", movieTitle: "Citizen Kane", checked: true, favorite: true }];
    res = await post("/update/" + USER_ID, { movieData: newList });
    check("POST valid update -> 200", res.status === 200, "got " + res.status);
    check("reports one document matched", res.body && res.body.matchedCount === 1, JSON.stringify(res.body));

    const after = await collection.findOne({ _id: new ObjectId(USER_ID) });
    check(
        "database actually updated",
        after.movieData.length === 1 && after.movieData[0].checked === true && after.movieData[0].favorite === true,
        JSON.stringify(after.movieData)
    );
    check(
        "update left credentials untouched",
        after.password === CREDENTIALS.password && after.hash === CREDENTIALS.hash && after.salt === CREDENTIALS.salt,
        "the $set must only touch movieData"
    );
    check("update left userName untouched", after.userName === "user1", "got " + after.userName);

    res = await post("/update/" + USER_ID, { movieData: "not-an-array" });
    check("POST non-array movieData -> 400", res.status === 400, "got " + res.status);

    res = await post("/update/" + USER_ID, {});
    check("POST missing movieData -> 400", res.status === 400, "got " + res.status);

    res = await post("/update/" + OTHER_ID, { movieData: [] });
    check("POST unknown user -> 404", res.status === 404, "got " + res.status);

    res = await post("/update/123456789012", { movieData: [] });
    check("POST malformed id -> 400", res.status === 400, "got " + res.status);

    // --- misc ---
    res = await get("/no-such-route");
    check("unknown route -> 404", res.status === 404, "got " + res.status);

    res = await get("/userData/" + USER_ID);
    check("server still answering after every error", res.status === 200, "got " + res.status);
}

(async () => {
    let fatal = null;

    try {
        await setup();
        await run();
    } catch (err) {
        fatal = err;
    } finally {
        try { await teardown(); } catch (err) { /* best effort */ }
    }

    for (const t of results) {
        if (t.pass) {
            console.log("PASS  " + t.name);
        } else {
            console.log("FAIL  " + t.name + "\n        " + (t.detail || ""));
        }
    }

    const failed = results.filter((t) => !t.pass).length;
    const driver = require("mongodb/package.json").version;
    console.log(
        "\n" + (results.length - failed) + "/" + results.length +
        " passed   (mongodb driver " + driver + ", node " + process.version + ")"
    );

    if (fatal) {
        console.error("\nFATAL:", fatal);
        process.exit(1);
    }
    process.exit(failed ? 1 : 0);
})();
