# cinemafile

[![CI](https://github.com/iantherrera/cinemafile/actions/workflows/ci.yml/badge.svg)](https://github.com/iantherrera/cinemafile/actions/workflows/ci.yml)

by Ian Herrera

A full-stack React application for keeping your own copy of the AFI top 100 films — mark what you have seen, flag favourites, drop the ones you will never watch, and reset to the original list whenever you like. Each account keeps its own list.

[Project Notes & Wireframes](https://drive.google.com/file/d/194O0oHOlF9V_1GsRv403Ydp8lIth-PZk/view?usp=sharing) · [Video demo](https://youtu.be/ykbVYPiow3U) (the original capstone submission, before accounts were added)

---

## Running it locally

### Prerequisites

- **Node 22.12 or newer** — Vite 8 and Vitest 5 both require it. Developed against 26.13.1.
- A free **MongoDB Atlas** cluster.

### 1. Create the database

In [Atlas](https://cloud.mongodb.com): **Create** → **Free**, pick a provider and region, name it, **Create**. In the Security Quickstart that follows, add a database user and add your current IP to the access list.

Then **Connect** → **Drivers** → **Node.js** and copy the connection string. It looks like:

```
mongodb+srv://<db_username>:<db_password>@<cluster>.mongodb.net/
```

Replace both placeholders, brackets included. Percent-encode any special characters in the password (`@` → `%40`). You do not need a database name in the string — the app uses `cinefile` and creates it on first write.

### 2. Configure the server

```bash
cd server
cp config.env.example config.env
```

Fill in `ATLAS_URI` with the string above, and generate a session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`config.env` is gitignored. Every setting is documented in `config.env.example`; only `ATLAS_URI` is strictly required, though without `SESSION_SECRET` a temporary one is generated and everyone is signed out on each restart.

### 3. Install and run

From the repository root, in two terminals:

```bash
# terminal 1 — API on :5000
cd server
npm install
npm start
```

```bash
# terminal 2 — app on :3000
cd client
npm install
npm run dev
```

Open <http://localhost:3000> and register. New accounts start with the full AFI list.

The server logs `Connected to MongoDB database "cinefile".` on success. If it reports `DATABASE UNAVAILABLE` instead, the line below names the cause: a hostname that does not resolve, rejected credentials, or — most often — an IP that is not on the Atlas access list.

---

## Tests

```bash
cd server && npm test   # 66 integration tests
cd client && npm test   # 28 component tests
```

Both suites run on every push via GitHub Actions.

The server tests run against a real `mongod`, started by `mongodb-memory-server` and thrown away afterwards. They use the real driver, the real database module and the same Express app the server builds, so they exercise actual behaviour rather than stubs — including that credentials never leave the database, that one account cannot read another's list, and that logout invalidates the session server-side.

The client tests use Vitest and Testing Library against jsdom, mocking the API module so they test what the components do rather than re-testing the wire.

---

## How it is built

**Client** — React 18 with React Router, built by Vite. `AuthContext` owns the session and is restored on load from `/auth/me`; route guards hold rendering until that check resolves rather than guessing. `MovieCards` owns the list and passes handlers down; every update builds a new array, so React re-renders and the UI always reflects state. Gallery and list views are driven by one piece of state and CSS, with no direct DOM manipulation.

**Server** — Express with session cookies. Passwords are hashed with scrypt from `node:crypto`, each with its own salt, compared in constant time; nothing stores a plaintext password. Sessions live in httpOnly cookies backed by MongoDB, so a script on the page cannot read the credential and signing out invalidates it server-side. The signed-in user's id comes from the session, never the URL. Sign-in and registration are rate limited per IP.

**API**

| Route | Purpose |
| --- | --- |
| `POST /auth/register` | Create an account, seeded with the default list |
| `POST /auth/login` | Sign in |
| `POST /auth/logout` | Destroy the session |
| `GET /auth/me` | Who is signed in |
| `GET /userData` | The signed-in user's list |
| `POST /update` | Replace that list |
| `POST /reset` | Restore the default list and return it |

### Known limitations

- **No password reset.** There is no email on accounts, so a forgotten password means a lost account.
- Rate limiting is per-IP and in memory, so counters reset on restart and are not shared across instances.
- `sameSite: "lax"` covers the common CSRF cases; there is no CSRF token.

---

## Code Louisville Capstone Project

Originally submitted November 2022. The requirements it was built against:

#### SECTION 1:
☑  Use arrays, objects, sets or maps to store and retrieve information that is displayed in your app.
- Arrays, objects, and maps are used to manage data, store in database, and populate movie list information rendered for each movie entry.

☑  Analyze data that is stored in arrays, objects, sets or maps and display information about it in your app.
- Movie metadata stored in arrays, objects, and maps are filtered for desired data and mapping is used to iterate through arrays to display rendered components.

#### SECTION 2:
☑  Retrieve data from a third-party API and use it to display something within your app.
- Movie list data is updated and stored after user makes any changes to list properties. Components are dynamically rendered as database continues to change with user edits.

☑  Persist data to an external API and make the stored data accessible in your app (including after reload/refresh).
- Customized movie list data is persistent on MongoDB and updated user data in database is utilized for every new session and render.

#### SECTION 3: OPTIONAL
☑  Create a node.js web server using a modern framework such as Express.js or Fastify.  Serve at least one route that your app uses (must serve more than just the index.html file).
- Application utilizes a node server built with Express. Routes utilized retrieve data and update database.

☑  Interact with a database to store and retrieve information (e.g. MySQL, MongoDB, etc).
- Application utilizes MongoDB for data storage and retrieval.

☑  Develop your project using a common JavaScript framework such as React, Angular, or Vue.
- Front-end application is developed with React and utilizes hooks, props, state, and component-based structures.
