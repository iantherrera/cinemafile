// Password hashing with scrypt from node:crypto.
//
// scrypt is a memory-hard key derivation function, which is what you want for
// passwords: it is deliberately expensive to evaluate, so guessing at scale
// costs real time and memory. Using the built-in avoids a native dependency
// that would need compiling on every platform this runs on.
//
// Each user gets their own random salt, stored alongside the hash, so two
// people choosing the same password still produce different hashes and one
// precomputed table cannot cover both.

const crypto = require("crypto");
const { promisify } = require("util");

const scrypt = promisify(crypto.scrypt);

const SALT_BYTES = 16;
const KEY_BYTES = 64;

// Cost parameters. N must be a power of two; raising it makes both hashing and
// guessing proportionally more expensive. 2^15 keeps a single hash in the low
// hundreds of milliseconds, which is unnoticeable on login and painful in bulk.
const SCRYPT_PARAMS = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 200;

// scrypt is expensive by design, so an unbounded password is a cheap way for a
// caller to tie up the event loop.
function validatePassword(password) {
    if (typeof password !== "string") return "Password is required";
    if (password.length < MIN_PASSWORD_LENGTH) {
        return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
        return `Password must be at most ${MAX_PASSWORD_LENGTH} characters`;
    }
    return null;
}

async function hashPassword(password) {
    const salt = crypto.randomBytes(SALT_BYTES).toString("hex");
    const derived = await scrypt(password, salt, KEY_BYTES, SCRYPT_PARAMS);
    return { hash: derived.toString("hex"), salt };
}

// Compares in constant time. A plain === leaks how much of the hash matched
// through how long the comparison took, which is enough to reconstruct it one
// byte at a time given enough attempts.
async function verifyPassword(password, hash, salt) {
    if (typeof password !== "string" || typeof hash !== "string" || typeof salt !== "string") {
        return false;
    }

    let derived;
    try {
        derived = await scrypt(password, salt, KEY_BYTES, SCRYPT_PARAMS);
    } catch (err) {
        return false;
    }

    const stored = Buffer.from(hash, "hex");
    if (stored.length !== derived.length) return false;

    return crypto.timingSafeEqual(stored, derived);
}

module.exports = {
    hashPassword,
    verifyPassword,
    validatePassword,
    MIN_PASSWORD_LENGTH,
    MAX_PASSWORD_LENGTH,
};
