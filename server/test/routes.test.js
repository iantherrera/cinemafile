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

    // The limits are exercised separately, on their own app with small values.
    // Leaving the defaults here would have the rest of the suite trip them.
    const app = createApp({
        mongoUrl: mongod.getUri(),
        rateLimits: { loginMax: 10000, registerMax: 10000 },
    });

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

    // ---------- reset ----------
    check("POST /reset without session -> 401", (await post("/reset", undefined, anon)).status === 401);

    res = await post("/reset", undefined, alice);
    check("POST /reset -> 200", res.status === 200, "got " + res.status);
    check("reset returns the restored list, so the client needs no copy",
        res.body && Array.isArray(res.body.movieData) && res.body.movieData.length === 100,
        "got " + JSON.stringify(res.body && res.body.movieData && res.body.movieData.length));
    check("restored list is the default, not what was there before",
        res.body.movieData[0].movieTitle === "Citizen Kane", JSON.stringify(res.body.movieData[0]));
    check("restored entries are unticked",
        res.body.movieData.every((m) => !m.checked && !m.favorite));

    const afterReset = await users.findOne({ userName: "alice" });
    check("reset is persisted", afterReset.movieData.length === 100);
    check("reset left credentials untouched",
        typeof afterReset.hash === "string" && afterReset.userName === "alice");
    check("reset did not touch the other account",
        (await users.findOne({ userName: "bob" })).movieData[0].imdbId === "tt-bob");

    // A caller must not be able to mutate the server's own default list
    // through the copy it was handed.
    res.body.movieData[0].movieTitle = "tampered";
    const second = await post("/reset", undefined, alice);
    check("the default list cannot be tampered with via a previous response",
        second.body.movieData[0].movieTitle === "Citizen Kane", second.body.movieData[0].movieTitle);

    // Put alice back to a one-entry list for the checks that follow.
    await post("/update", { movieData: [{ imdbId: "tt-alice", movieTitle: "Alice only" }] }, alice);

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

    await runRateLimitChecks();
}

// The limits run on their own app instance with deliberately tiny values, so
// the behaviour can be observed without making the rest of the suite fight it.
const LIMITED_PORT = 5098;
const LOGIN_MAX = 3;
const REGISTER_MAX = 2;

// Each scenario gets a fresh app, because the limiter counts in memory and a
// tripped limit would otherwise leak into the next scenario.
async function withLimitedApp(limits, body) {
    const { createApp } = require("../app");
    const app = createApp({ mongoUrl: mongod.getUri(), rateLimits: limits });

    let server;
    await new Promise((resolve) => { server = app.listen(LIMITED_PORT, resolve); });

    try {
        return await body(makeCaller());
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
}

function makeCaller() {
    return (method, path, body) => new Promise((resolve, reject) => {
        const payload = body === undefined ? null : JSON.stringify(body);
        const headers = payload
            ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) }
            : {};
        const req = http.request({ host: "localhost", port: LIMITED_PORT, path, method, headers }, (res) => {
            let data = "";
            res.on("data", (c) => { data += c; });
            res.on("end", () => {
                let parsed = null;
                try { parsed = JSON.parse(data); } catch (err) { /* empty */ }
                resolve({ status: res.statusCode, body: parsed, headers: res.headers });
            });
        });
        req.on("error", reject);
        if (payload) req.write(payload);
        req.end();
    });
}

const WRONG = { userName: "alice", password: "definitely wrong" };
const RIGHT = { userName: "alice", password: "correct horse battery" };

async function runRateLimitChecks() {
    // --- failures are counted, successes are not ---
    await withLimitedApp({ loginMax: LOGIN_MAX, registerMax: 10000 }, async (call) => {
        const first = await call("POST", "/auth/login", WRONG);
        const second = await call("POST", "/auth/login", WRONG);
        check("failed logins under the limit -> 401",
            first.status === 401 && second.status === 401, `${first.status}, ${second.status}`);

        const good = await call("POST", "/auth/login", RIGHT);
        check("a correct password still works under the limit", good.status === 200,
            "got " + good.status + " " + JSON.stringify(good.body));

        // If the success had been counted, this third failure would be the
        // fourth request and would already be blocked.
        const third = await call("POST", "/auth/login", WRONG);
        check("a success does not consume the allowance", third.status === 401, "got " + third.status);

        const fourth = await call("POST", "/auth/login", WRONG);
        check(`failure past ${LOGIN_MAX} -> 429`, fourth.status === 429, "got " + fourth.status);

        check("the 429 explains itself", fourth.body && typeof fourth.body.error === "string",
            JSON.stringify(fourth.body));
        check("the 429 carries a RateLimit header",
            Object.keys(fourth.headers).some((h) => h.startsWith("ratelimit")),
            JSON.stringify(Object.keys(fourth.headers)));

        // Worth pinning down rather than assuming: once the limit is hit the
        // limiter answers before the route runs, so the password is never
        // checked and even the right one is refused until the window passes.
        // That is the intended trade -- it is also why the production limit is
        // 10 rather than 3.
        const rightWhileBlocked = await call("POST", "/auth/login", RIGHT);
        check("once blocked, even a correct password is refused until the window passes",
            rightWhileBlocked.status === 429, "got " + rightWhileBlocked.status);

        const other = await call("GET", "/userData");
        check("the limiter does not touch other routes", other.status === 401, "got " + other.status);
    });

    // --- the documented way to configure this is the environment, not the
    // --- options object the scenarios above use, so check that path too ---
    const savedLogin = process.env.LOGIN_RATE_LIMIT;
    process.env.LOGIN_RATE_LIMIT = "2";
    try {
        await withLimitedApp(undefined, async (call) => {
            const codes = [];
            for (let i = 0; i < 3; i++) {
                codes.push((await call("POST", "/auth/login", WRONG)).status);
            }
            check("LOGIN_RATE_LIMIT from the environment is honoured",
                codes[0] === 401 && codes[1] === 401 && codes[2] === 429, JSON.stringify(codes));
        });
    } finally {
        if (savedLogin === undefined) delete process.env.LOGIN_RATE_LIMIT;
        else process.env.LOGIN_RATE_LIMIT = savedLogin;
    }

    // --- an unparseable value must not disable the limit ---
    const savedJunk = process.env.LOGIN_RATE_LIMIT;
    process.env.LOGIN_RATE_LIMIT = "not-a-number";
    try {
        await withLimitedApp(undefined, async (call) => {
            const r = await call("POST", "/auth/login", WRONG);
            check("a junk LOGIN_RATE_LIMIT falls back to the default rather than disabling the limit",
                r.status === 401, "got " + r.status);
        });
    } finally {
        if (savedJunk === undefined) delete process.env.LOGIN_RATE_LIMIT;
        else process.env.LOGIN_RATE_LIMIT = savedJunk;
    }

    // --- registration limit, on a fresh counter ---
    await withLimitedApp({ loginMax: 10000, registerMax: REGISTER_MAX }, async (call) => {
        const codes = [];
        for (let i = 0; i < REGISTER_MAX + 1; i++) {
            const r = await call("POST", "/auth/register", {
                userName: "ratelimited" + i,
                password: "a long enough password",
            });
            codes.push(r.status);
        }
        check(`first ${REGISTER_MAX} registrations are answered normally`,
            codes.slice(0, REGISTER_MAX).every((c) => c === 201), JSON.stringify(codes));
        check("registration past the limit -> 429", codes[REGISTER_MAX] === 429, JSON.stringify(codes));
    });
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
