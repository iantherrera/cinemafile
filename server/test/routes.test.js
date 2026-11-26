// Integration tests for the auth and userData routes.
//
// These run against a real mongod started by mongodb-memory-server, using the
// real driver, the real db/conn.js and the app built by app.js -- the same
// middleware stack the server runs, sessions included. Nothing is stubbed, so
// the suite reflects actual behaviour and doubles as the check that a
// dependency upgrade has changed nothing.
//
// Run with: npm test   (from the server directory)

const http = require("http");
const { MongoMemoryServer } = require("mongodb-memory-server");

const dbObj = require("../db/conn");

const PORT = 5099;

let mongod;
let httpServer;
let users;
const results = [];

function check(name, pass, detail) {
    results.push({ name, pass: !!pass, detail });
}

// A tiny cookie jar, so a "session" in these tests is a real cookie round trip
// rather than something reached into directly.
function newJar() {
    return { cookie: null };
}

function request(method, path, body, jar) {
    return new Promise((resolve, reject) => {
        const payload = body === undefined ? null : JSON.stringify(body);
        const headers = {};
        if (payload) {
            headers["Content-Type"] = "application/json";
            headers["Content-Length"] = Buffer.byteLength(payload);
        }
        if (jar && jar.cookie) headers["Cookie"] = jar.cookie;

        const req = http.request({ host: "localhost", port: PORT, path, method, headers }, (res) => {
            const setCookie = res.headers["set-cookie"];
            if (jar && setCookie && setCookie.length) {
                jar.cookie = setCookie.map((c) => c.split(";")[0]).join("; ");
            }

            let data = "";
            res.on("data", (chunk) => { data += chunk; });
            res.on("end", () => {
                let parsed = null;
                try { parsed = JSON.parse(data); } catch (err) { /* empty or non-JSON */ }
                resolve({ status: res.statusCode, body: parsed, setCookie });
            });
        });

        req.on("error", reject);
        if (payload) req.write(payload);
        req.end();
    });
}

const get = (path, jar) => request("GET", path, undefined, jar);
const post = (path, body, jar) => request("POST", path, body, jar);

// Windows reserves blocks inside the dynamic port range (Hyper-V and WSL claim
// them), and binding one fails with EACCES. mongodb-memory-server picks a
// random dynamic port and does not retry when it lands in a reserved block, so
// choose from the range below 49152 instead, where no such reservations exist.
const MONGOD_PORTS = [47017, 47018, 47019, 47020, 47021];

async function startMongod() {
    let lastError;
    for (const port of MONGOD_PORTS) {
        try {
            return await MongoMemoryServer.create({ instance: { port } });
        } catch (err) {
            lastError = err;
            if (err && (err.code === "EACCES" || err.code === "EADDRINUSE")) continue;
            throw err;
        }
    }
    throw lastError;
}

async function setup() {
    mongod = await startMongod();
    process.env.ATLAS_URI = mongod.getUri();
    process.env.SESSION_SECRET = "test-secret-not-used-anywhere-real";

    const db = await dbObj.connectToServer();
    users = db.collection("userData");

    const { createApp } = require("../app");
    const app = createApp({ mongoUrl: mongod.getUri() });

    await new Promise((resolve) => { httpServer = app.listen(PORT, resolve); });
}

async function teardown() {
    if (httpServer) await new Promise((resolve) => httpServer.close(resolve));
    await dbObj.closeConnection();
    if (mongod) await mongod.stop();
}

async function run() {
    // ---------- registration ----------
    const alice = newJar();
    let res = await post("/auth/register", { userName: "Alice", password: "correct horse battery" }, alice);
    check("register -> 201", res.status === 201, "got " + res.status + " " + JSON.stringify(res.body));
    check("register returns the user", res.body && res.body.user && res.body.user.userName === "alice",
        "username should be normalised to lowercase: " + JSON.stringify(res.body));
    check("register sets a session cookie", Array.isArray(res.setCookie) && res.setCookie.length > 0);
    check("session cookie is httpOnly",
        res.setCookie && /httponly/i.test(res.setCookie[0]), res.setCookie && res.setCookie[0]);
    check("register response leaks no credential fields",
        res.body && res.body.user && !("hash" in res.body.user) && !("salt" in res.body.user) && !("password" in res.body.user),
        JSON.stringify(res.body && res.body.user));

    const stored = await users.findOne({ userName: "alice" });
    check("password is not stored in plaintext",
        stored && !("password" in stored) && typeof stored.hash === "string" && typeof stored.salt === "string",
        JSON.stringify(stored && Object.keys(stored)));
    check("stored hash does not contain the password",
        stored && !stored.hash.includes("correct"), "hash must not be reversible to the input");
    check("new account is seeded with the default list",
        stored && Array.isArray(stored.movieData) && stored.movieData.length === 100,
        "got " + (stored && stored.movieData && stored.movieData.length));

    // ---------- registration validation ----------
    res = await post("/auth/register", { userName: "alice", password: "another password" }, newJar());
    check("duplicate username -> 409", res.status === 409, "got " + res.status);

    res = await post("/auth/register", { userName: "ALICE", password: "another password" }, newJar());
    check("duplicate differing only by case -> 409", res.status === 409, "got " + res.status);

    res = await post("/auth/register", { userName: "ok_name", password: "short" }, newJar());
    check("short password -> 400", res.status === 400, "got " + res.status);

    res = await post("/auth/register", { userName: "ab", password: "long enough password" }, newJar());
    check("username under 3 chars -> 400", res.status === 400, "got " + res.status);

    res = await post("/auth/register", { userName: "bad name!", password: "long enough password" }, newJar());
    check("username with illegal characters -> 400", res.status === 400, "got " + res.status);

    res = await post("/auth/register", {}, newJar());
    check("empty registration body -> 400", res.status === 400, "got " + res.status);

    // ---------- the session actually works ----------
    res = await get("/auth/me", alice);
    check("GET /auth/me with session -> 200", res.status === 200, "got " + res.status);
    check("/auth/me returns the right user", res.body && res.body.user.userName === "alice");

    res = await get("/userData", alice);
    check("GET /userData with session -> 200", res.status === 200, "got " + res.status);
    check("returns the seeded list", res.body && res.body.movieData.length === 100);
    check("no credential fields in the data response",
        res.body && !("hash" in res.body) && !("salt" in res.body),
        JSON.stringify(res.body && Object.keys(res.body)));

    // ---------- unauthenticated access is refused ----------
    const anon = newJar();
    check("GET /userData without session -> 401", (await get("/userData", anon)).status === 401);
    check("POST /update without session -> 401", (await post("/update", { movieData: [] }, anon)).status === 401);
    check("GET /auth/me without session -> 401", (await get("/auth/me", anon)).status === 401);

    // ---------- login ----------
    const alice2 = newJar();
    res = await post("/auth/login", { userName: "alice", password: "wrong password" }, alice2);
    check("wrong password -> 401", res.status === 401, "got " + res.status);
    check("wrong password gives nothing away",
        res.body && res.body.error === "Incorrect username or password", JSON.stringify(res.body));

    res = await post("/auth/login", { userName: "nobody", password: "wrong password" }, alice2);
    check("unknown user -> 401", res.status === 401, "got " + res.status);
    check("unknown user and wrong password are indistinguishable",
        res.body && res.body.error === "Incorrect username or password", JSON.stringify(res.body));

    res = await post("/auth/login", { userName: "ALICE", password: "correct horse battery" }, alice2);
    check("login is case-insensitive -> 200", res.status === 200, "got " + res.status);
    check("login returns the user", res.body && res.body.user.userName === "alice");
    check("logged-in session reads data", (await get("/userData", alice2)).status === 200);

    // ---------- one user cannot reach another's data ----------
    const bob = newJar();
    res = await post("/auth/register", { userName: "bob", password: "bobs long password" }, bob);
    check("second account registers -> 201", res.status === 201, "got " + res.status);

    await post("/update", { movieData: [{ imdbId: "tt-bob", movieTitle: "Bob only" }] }, bob);
    await post("/update", { movieData: [{ imdbId: "tt-alice", movieTitle: "Alice only" }] }, alice);

    const bobSees = await get("/userData", bob);
    const aliceSees = await get("/userData", alice);
    check("each session sees only its own list",
        bobSees.body.movieData[0].imdbId === "tt-bob" && aliceSees.body.movieData[0].imdbId === "tt-alice",
        "bob: " + JSON.stringify(bobSees.body.movieData) + " alice: " + JSON.stringify(aliceSees.body.movieData));

    const aliceDoc = await users.findOne({ userName: "alice" });
    const bobDoc = await users.findOne({ userName: "bob" });
    check("writes landed on the right documents",
        aliceDoc.movieData[0].imdbId === "tt-alice" && bobDoc.movieData[0].imdbId === "tt-bob");
    check("update left credentials untouched",
        typeof aliceDoc.hash === "string" && typeof aliceDoc.salt === "string" && aliceDoc.userName === "alice");

    // ---------- update validation ----------
    check("POST /update non-array -> 400", (await post("/update", { movieData: "nope" }, alice)).status === 400);
    check("POST /update missing field -> 400", (await post("/update", {}, alice)).status === 400);

    // ---------- logout ----------
    res = await post("/auth/logout", undefined, bob);
    check("logout -> 204", res.status === 204, "got " + res.status);
    check("session is dead after logout", (await get("/userData", bob)).status === 401);
    check("/auth/me is 401 after logout", (await get("/auth/me", bob)).status === 401);
    check("alice's session survives bob's logout", (await get("/userData", alice)).status === 200);

    // ---------- misc ----------
    check("unknown route -> 404", (await get("/no-such-route", alice)).status === 404);
    check("server still answering after every error", (await get("/userData", alice)).status === 200);
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
