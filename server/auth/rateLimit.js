// Keyed on IP rather than username on purpose: counting failures per account
// would let anyone lock a known user out by sending bad passwords at it. The
// cost is that an attacker spread across many addresses is not stopped here --
// scrypt is what makes that expensive.
//
// The store is in memory, so counters reset on restart and are not shared
// between instances. Several behind a load balancer would need a shared store.

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
            // Counting successes would lock out a shared address such as an
            // office or a household.
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
