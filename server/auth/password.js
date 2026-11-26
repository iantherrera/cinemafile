// scrypt is memory-hard, so guessing at scale costs real time and memory, and
// being built in avoids a native dependency to compile per platform. The
// per-user salt means identical passwords hash differently and no single
// precomputed table covers them.

const crypto = require("crypto");
const { promisify } = require("util");

const scrypt = promisify(crypto.scrypt);

const SALT_BYTES = 16;
const KEY_BYTES = 64;

// N must be a power of two, and raising it costs hashing and guessing alike.
// 2^15 lands in the low hundreds of milliseconds: unnoticeable once, painful
// in bulk.
const SCRYPT_PARAMS = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 200;

// Verified against when no account matched, so a sign-in attempt costs the
// same whether the username exists or not. Skipping the hash for an unknown
// name answers in about a millisecond where a real one takes ninety, which
// tells an attacker which usernames are registered however carefully the
// error message is worded.
const ABSENT_USER = {
    hash: crypto.randomBytes(KEY_BYTES).toString("hex"),
    salt: crypto.randomBytes(SALT_BYTES).toString("hex"),
};

// scrypt is expensive by design, so an unbounded password is a cheap way to
// tie up the event loop.
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

// Constant time: a plain === leaks how much of the hash matched through how
// long it took, which is enough to rebuild it a byte at a time.
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
    ABSENT_USER,
    MIN_PASSWORD_LENGTH,
};
