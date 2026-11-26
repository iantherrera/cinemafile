// Rate limits for the authentication endpoints.
//
// Keyed on client IP rather than username, deliberately. Counting failures per
// account would let anyone lock a known user out of their own account by
// sending bad passwords at it -- trading a brute-force defence for a denial of
// service. Per-IP limiting has the opposite weakness: an attacker spreading
// attempts across many addresses is not stopped by it. scrypt is what makes
// that expensive, and this keeps a single source from grinding through
// guesses cheaply.
//
// The store is in memory, so counters reset when the server restarts and are
// not shared between instances. For one process that is fine. Running several
// behind a load balancer needs a shared store.

const rateLimit = require("express-rate-limit");

const MINUTE = 60 * 1000;

function numberFromEnv(name, fallback) {
    const raw = process.env[name];
    if (raw === undefined || raw === "") return fallback;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function tooMany(message) {
    return (req, res) => res.status(429).json({ error: message });
}

function createLimiters(overrides = {}) {
    const loginMax = overrides.loginMax ?? numberFromEnv("LOGIN_RATE_LIMIT", 10);
    const loginWindowMs = overrides.loginWindowMs ?? 15 * MINUTE;

    const registerMax = overrides.registerMax ?? numberFromEnv("REGISTER_RATE_LIMIT", 5);
    const registerWindowMs = overrides.registerWindowMs ?? 60 * MINUTE;

    return {
        login: rateLimit({
            windowMs: loginWindowMs,
            limit: loginMax,
            // Only failures count. Someone signing in correctly, even often,
            // is not who this is for, and counting successes would lock out a
            // shared address such as an office or a household.
            skipSuccessfulRequests: true,
            standardHeaders: "draft-7",
            legacyHeaders: false,
            handler: tooMany("Too many sign-in attempts. Try again later."),
        }),

        register: rateLimit({
            windowMs: registerWindowMs,
            limit: registerMax,
            standardHeaders: "draft-7",
            legacyHeaders: false,
            handler: tooMany("Too many accounts created from here. Try again later."),
        }),
    };
}

module.exports = { createLimiters };
