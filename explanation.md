# Codebase Explanation — Player Details Module

A deep-dive into every significant decision in the project: **what** the code does, **why** that approach was chosen, and **what benefits** it provides.

---

## Table of Contents
1. [Project Architecture](#1-project-architecture)
2. [server.js — Line-by-Line](#2-serverjs--line-by-line)
3. [index.html — Key Decisions](#3-indexhtml--key-decisions)
4. [style.css — Key Decisions](#4-stylecss--key-decisions)
5. [script.js — Line-by-Line](#5-scriptjs--line-by-line)

---

## 1. Project Architecture

```
player-module/
├── server.js          ← Node.js + Express backend (API + static file server)
├── package.json       ← Dependencies: express, mongodb
└── public/            ← Everything in here is served directly to the browser
    ├── index.html
    ├── style.css
    └── script.js
```

**Why this structure?**
Separating `public/` from `server.js` is the standard convention for Express apps.  
`express.static("public")` serves the frontend; the rest of `server.js` handles the API.  
There is **zero build step** — no Webpack, no bundler — keeping it simple for a class project.

---

## 2. `server.js` — Line-by-Line

### Imports and Setup

```js
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const path = require("path");
```
- **`express`** — imported from the `express` npm package. It wraps Node's `http` module with a clean router API.
- **`MongoClient`** — the official MongoDB driver class for connecting to a database.
- **`ObjectId`** — MongoDB stores `_id` fields as BSON ObjectIds (12-byte binary), not plain strings. We import `ObjectId` so we can convert URL strings (like `"6849abc..."`) back into the type MongoDB expects.
- **`path`** — a core Node.js module for building file paths in an OS-agnostic way (`path.join` uses `\` on Windows, `/` on Mac/Linux automatically).

---

```js
const PORT = 3000;
const MONGO_URI = "mongodb://127.0.0.1:27017";
```
- **`PORT`** — hardcoded for simplicity. In production you'd read `process.env.PORT`.
- **`127.0.0.1`** — the loopback address (same machine). `27017` is MongoDB's default port.

---

```js
let db;
```
- Declared at **module scope** (outside any function) so every route handler can access it.
- We use `let` (not `const`) because it starts as `undefined` and gets assigned after the async connection succeeds.

---

### `connectDB` function

```js
async function connectDB() {
  const client = await MongoClient.connect(MONGO_URI);
  db = client.db(DB_NAME);
}
```
- `MongoClient.connect()` is **asynchronous** — it opens a network socket to MongoDB, which takes a non-zero amount of time.
- `await` pauses `connectDB()` until the connection is established, then assigns `client`.
- `client.db(DB_NAME)` selects (or creates) the `playerdb` database. MongoDB creates it lazily on first write.
- **Benefit of `async/await` here**: the alternative `.then()/.catch()` chain would be harder to read and reason about.

---

### Middleware

```js
app.use(express.json());
```
- **What it does**: reads the raw request body, parses it as JSON, and attaches the result to `req.body`.
- **Why it's needed**: HTTP bodies arrive as raw bytes (a stream). Without this, `req.body` would be `undefined` in POST/PUT routes.
- **Non-blocking**: Express processes the body asynchronously. The event loop is never blocked waiting for bytes.

```js
app.use(express.static(path.join(__dirname, "public")));
```
- **`__dirname`** — a Node.js global that holds the directory of the current file (`server.js`'s folder). Using `path.join` ensures the path is correct regardless of the OS.
- **`express.static`** — tells Express: "if a request comes in for `/index.html`, `/style.css`, etc., just send the file directly from the `public/` folder."
- **Why this matters**: it means we only need **one server** for both the API and the frontend.

---

### Route: GET /api/players

```js
app.get("/api/players", async (req, res) => {
  const players = await db.collection(COLLECTION).find({}).toArray();
  res.json(players);
});
```
- `find({})` — empty filter `{}` means "match all documents." Returns a MongoDB **cursor** (a lazy iterator, not all data at once).
- `.toArray()` — converts the cursor into a JS Array. This is **awaited** because it performs I/O to read all documents.
- `res.json(players)` — serializes the JS array to a JSON string and sets `Content-Type: application/json` automatically.
- **Non-blocking**: `await` yields the event loop while MongoDB reads; other requests can be processed in parallel.

---

### Route: POST /api/players

```js
const { name, position, team, goals, age } = req.body;
```
- **Destructuring assignment** — extracts specific fields from `req.body` in one clean line instead of `req.body.name`, `req.body.position`, etc.

```js
if (!name || !position) {
  return res.status(400).json({ error: "Name and Position are required." });
}
```
- **Server-side validation** — we never trust the client. Even if JavaScript is disabled in the browser, the API still enforces required fields.
- `400 Bad Request` is the correct HTTP status for "you sent invalid data."

```js
const result = await db.collection(COLLECTION).insertOne(newPlayer);
res.status(201).json({ _id: result.insertedId, ...newPlayer });
```
- `insertOne()` returns an object with `insertedId` (the new `_id`).
- `201 Created` is the semantically correct success status for resource creation (vs. `200 OK` which means "request processed, here's a result").
- **Spread operator** `...newPlayer` copies all properties of `newPlayer` into the response object, so the frontend gets the full document including `_id`.

---

### Route: PUT /api/players/:id

```js
const filter = { _id: new ObjectId(id) };
const update = { $set: { name, position, team, goals: Number(goals), age: Number(age) } };
await db.collection(COLLECTION).updateOne(filter, update);
```
- **`new ObjectId(id)`** — converts the string from the URL into a BSON ObjectId so MongoDB can match it against stored `_id` values.
- **`$set`** — a MongoDB update operator that only replaces the listed fields. Without `$set`, `updateOne` would **replace the entire document**, deleting `createdAt` and any other field not included.
- **`Number(goals)`** — HTTP bodies are strings. `Number()` converts `"10"` → `10` so it's stored as a number in MongoDB (important for sorting/aggregations).

---

### IIFE Startup

```js
(async () => {
  await connectDB();
  app.listen(PORT, ...);
})();
```
- **IIFE** (Immediately Invoked Function Expression) — a function that defines and calls itself immediately. The `async` keyword makes it return a Promise internally so we can `await` inside.
- **Why**: `app.listen()` must not run until the database is ready. Sequencing them with `await` guarantees this.
- **`process.exit(1)`** — if MongoDB refuses connection, we exit with error code `1` so the OS/container knows the process failed.

---

## 3. `index.html` — Key Decisions

### `<script>` at bottom of `<body>`

```html
<script src="script.js"></script>   <!-- at the bottom of <body> -->
```
**Why**: When the browser parses HTML top-to-bottom, a `<script>` in `<head>` blocks rendering until the file is downloaded and executed. Placing it at the bottom means the entire DOM is built before JS runs — so `getElementById()` always finds its element.

---

### Data attributes on action buttons

```html
<button data-action="edit" data-id="${player._id}">✏ Edit</button>
```
**Why**: Instead of embedding function calls in `onclick=""`, we store metadata in `data-*` attributes and read them in a single event listener on the parent element (see Event Delegation below). This is cleaner and decouples HTML from JavaScript.

---

### `aria-live="polite"` on toast

```html
<div class="toast" id="toast" aria-live="polite"></div>
```
**Why**: Screen readers (for visually impaired users) won't automatically announce dynamically injected content. `aria-live="polite"` tells them to announce changes to this element after the user finishes their current interaction.

---

### Hidden `<input>` for edit state

```html
<input type="hidden" id="editingId" value="" />
```
**Why**: This stores the `_id` of the player currently being edited. When the form submits, we check if this field has a value — if yes, we `PUT`; if no, we `POST`. It's a simple way to reuse one form for both Create and Update.

---

## 4. `style.css` — Key Decisions

### CSS Custom Properties (variables)

```css
:root {
  --accent: #f5a623;
  --bg-surface: #161b22;
}
```
**Why**: Centralising values in `:root` means you can retheme the entire UI by changing one block. It also makes colours self-documenting (e.g. `var(--accent)` is more readable than `#f5a623`).

---

### Position badge colour by class

```css
.position-badge.Forward  { color: var(--red); }
.position-badge.Midfielder { color: var(--accent); }
```
**Why**: In `script.js` we add the position string as a class: `class="position-badge ${position}"`. CSS then automatically applies the correct colour without any JS logic. This is the CSS doing work so JavaScript doesn't have to.

---

### `overflow-x: auto` on table wrapper

```css
.table-wrapper { overflow-x: auto; }
```
**Why**: On mobile screens, wide tables would overflow and break the layout. `overflow-x: auto` adds a horizontal scrollbar just on the table, leaving the rest of the page intact.

---

## 5. `script.js` — Line-by-Line

### Section 1 — DOM References cached at top

```js
const playerForm = document.getElementById("playerForm");
```
- **`getElementById`** — the fastest DOM selector (uses an internal hash map). Prefix `#` is **not** used here (unlike `querySelector("#playerForm")`).
- **Why cache them**: calling `getElementById` inside a function that runs 100 times would query the DOM 100 times. Caching runs it once.

---

### Section 2 — `allPlayers` array as state

```js
let allPlayers = [];
```
- A module-level Array acting as our **in-memory state**.
- **Why**: Storing fetched data here means the search filter can filter without making additional network requests. We only hit the API when data actually changes (create/update/delete).

---

### Section 3 — API Helpers

```js
async function fetchAllPlayers() {
  const response = await fetch(API_BASE);
  if (!response.ok) throw new Error(`GET failed: ${response.status}`);
  return response.json();
}
```
- **`fetch()`** — the modern browser API for HTTP requests. Returns a **Promise** that resolves to a `Response`.
- **`await`** — suspends this `async` function (yields the event loop) until the Promise resolves. JavaScript remains responsive to user events during the wait.
- **`response.ok`** — true for status 200–299. We check it manually because `fetch` only rejects on network failures (DNS, no connection), **not** on HTTP error codes like 404 or 500.
- **`throw new Error(...)`** — converts a bad HTTP response into a JavaScript exception so callers can catch it uniformly with `try/catch`.
- **`response.json()`** — also returns a Promise; `return` passes it to the caller which can `await` it.

**Benefit of separate helper functions**: `createPlayer`, `updatePlayer`, and `deletePlayer` follow the same pattern. If the API URL changes, we update it in one place, not scattered across event handlers.

---

### Section 4 — `renderTable`

```js
tableBody.innerHTML = players.map((player, index) => `<tr>...</tr>`).join("");
```
- **`Array.map()`** — transforms the array of player objects into an array of HTML strings (one per player). It does **not** mutate the original array.
- **`.join("")`** — collapses `["<tr>...</tr>", "<tr>...</tr>"]` into a single string. Without the argument, `.join()` would insert commas.
- **Single `innerHTML` assignment** — setting `innerHTML` once is faster than calling `appendChild` in a loop, because the browser does one reflow instead of many.

```js
function escapeHTML(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}
```
- **Why**: If a player's name was `<script>alert('xss')</script>`, injecting it directly into `innerHTML` would execute that script. `createTextNode` treats the string as plain text, not markup. `div.innerHTML` then gives us the safe HTML-escaped version (e.g. `&lt;script&gt;`).
- **Benefit**: Prevents Cross-Site Scripting (XSS) attacks.

---

### Section 5 — `loadPlayers`

```js
async function loadPlayers() {
  loader.hidden = false;
  allPlayers = await fetchAllPlayers();
  renderTable(allPlayers);
  updateStats();
}
```
- **Orchestration function** — calls helpers in the right order. The `await` ensures we don't render before data arrives.
- `try/catch` around the `await` catches both network errors and our manually thrown errors from `fetchAllPlayers`.

---

### Section 6 — Form Submit Handler

```js
playerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  ...
});
```
- **`"submit"` event** — fires when the form is submitted via button click OR pressing Enter in a text field. More accessible than a click listener on the button.
- **`event.preventDefault()`** — stops the browser's default behaviour (reloading the page with query params in the URL).
- **`async` callback** — the event callback is an `async` function, allowing us to use `await` inside it.

```js
btnSubmit.disabled = true;   // prevent double-submit
```
- **Why**: Clicking "Add" twice quickly would send two identical POST requests, creating duplicate players. Disabling the button prevents this.

```js
} finally {
  btnSubmit.disabled = false;
}
```
- **`finally`** — runs whether the `try` block succeeded or the `catch` block ran. It guarantees the button is always re-enabled, even after an error.

---

### Section 7 — Event Delegation

```js
tableBody.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  ...
});
```
- **Event Delegation** — instead of attaching a listener to every `<button>` in the table (which would need to be re-added every time we call `renderTable`), we attach **one** listener to the parent `<tbody>`.
- **How events bubble**: when a button is clicked, the `click` event travels UP the DOM tree (bubbles) through `<tr>` → `<tbody>` → `<table>` → etc. We intercept it at `<tbody>`.
- **`event.target.closest("[data-action]")`** — `event.target` is the exact clicked element (could be text inside the button). `.closest()` walks up the tree until it finds an ancestor (or self) matching the CSS selector. If the user clicks outside a button, it returns `null`.
- **Benefit**: O(1) event listeners regardless of how many players are in the table. Also works automatically for newly injected rows.

---

### Section 8 — `handleEditClick`

```js
const player = allPlayers.find((p) => p._id === playerId);
inputName.value = player.name;
editingId.value = player._id;
```
- **`Array.find()`** — returns the first object where the callback returns `true`. More readable than a `for` loop with a `break`.
- **Pre-filling the form** — setting `.value` on input elements is direct DOM manipulation. The form now shows the player's existing data so the user only edits what they need.
- **`editingId.value = player._id`** — stores the `_id` in the hidden field. The submit handler reads this to decide PUT vs POST.

---

### Section 9 — Search Filter

```js
searchInput.addEventListener("input", () => {
  const filtered = allPlayers.filter(p => p.name.toLowerCase().includes(query));
  renderTable(filtered);
});
```
- **`"input"` event** — fires on every keystroke (unlike `"change"` which fires only on blur). Gives real-time filtering.
- **`Array.filter()`** — returns a **new array** of matching players. `allPlayers` is never mutated, so we can always get the full list back by calling `renderTable(allPlayers)`.
- **Client-side filtering** — no network request needed. The data is already in `allPlayers`. For very large datasets (thousands of records), you'd add a `?search=` query param to the API instead.

---

### Section 12 — Initialization

```js
loadPlayers(); // called at the bottom of script.js
```
- **Why here and not in an event listener**: because `script.js` is at the bottom of `<body>`, the DOM is fully parsed when this runs. We want data to load immediately on page open, so we call `loadPlayers()` directly.
- `loadPlayers()` returns a Promise (it's `async`), but we don't `await` it here because there's nothing to do after — the function handles its own rendering and error display internally.