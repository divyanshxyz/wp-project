# Code Explanation - Sports Player Management

This document explains how each file in the project works and why certain decisions were made.

---

## Table of Contents
1. [Project Structure](#1-project-structure)
2. [.env - Configuration](#2-env---configuration)
3. [db.js - Database Connection](#3-dbjs---database-connection)
4. [server.js - Entry Point](#4-serverjs---entry-point)
5. [routes/players.js - API Routes](#5-routesplayersjs---api-routes)
6. [index.html - Page Structure](#6-indexhtml---page-structure)
7. [style.css - Styling](#7-stylecss---styling)
8. [script.js - Frontend Logic](#8-scriptjs---frontend-logic)

---

## 1. Project Structure

```
WP Project/
  .env                  # environment variables (MongoDB URL, port)
  db.js                 # database connection module
  server.js             # main entry point
  routes/
    players.js          # API route handlers
  index.html            # page layout
  style.css             # styling
  script.js             # frontend JavaScript
  package.json          # dependencies
```

The project is split into multiple files so that each file has one clear responsibility. The database logic is in `db.js`, the API routes are in `routes/players.js`, and `server.js` ties everything together. The frontend files (`index.html`, `style.css`, `script.js`) are served as static files by Express.

---

## 2. `.env` - Configuration

```
MONGO_URI=mongodb://127.0.0.1:27017
DB_NAME=playerdb
PORT=3000
```

The MongoDB connection string and other settings are stored in a `.env` file instead of being hardcoded in the source code. The `dotenv` package loads these values into `process.env` when the server starts. This makes it easy to change the database URL or port without editing any code. The `.env` file is listed in `.gitignore` so it does not get committed to version control.

---

## 3. `db.js` - Database Connection

```js
const { MongoClient } = require("mongodb");

let db;

async function connectDB(uri, dbName) {
  const client = await MongoClient.connect(uri);
  db = client.db(dbName);
  console.log("Connected to MongoDB:", dbName);
  return db;
}

function getDB() {
  return db;
}

module.exports = { connectDB, getDB };
```

This file handles the MongoDB connection. `MongoClient.connect()` is an asynchronous operation, so we use `async/await` to wait for the connection to be established before doing anything else.

The `db` variable is declared at module scope so it can be shared. `connectDB` is called once when the server starts, and after that any file can call `getDB()` to access the database instance without reconnecting.

We export both functions using `module.exports` so other files can import them with `require()`.

---

## 4. `server.js` - Entry Point

```js
require("dotenv").config();
const express = require("express");
const path = require("path");
const { connectDB } = require("./db");
const playerRoutes = require("./routes/players");

const app = express();
const PORT = process.env.PORT || 3000;
```

The first line loads environment variables from `.env` into `process.env`. Then we import Express, the database module, and the player routes.

```js
app.use(express.json());
app.use(express.static(__dirname));
```

`express.json()` is middleware that parses incoming JSON request bodies. Without it, `req.body` would be `undefined` in POST and PUT routes.

`express.static(__dirname)` serves the frontend files (HTML, CSS, JS) from the project directory. This means one server handles both the API and the frontend.

```js
app.use("/api/players", playerRoutes);
```

This mounts all the player routes under `/api/players`. So a GET request to `/api/players` will be handled by the router defined in `routes/players.js`.

```js
(async () => {
  try {
    await connectDB(process.env.MONGO_URI, process.env.DB_NAME);
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Could not connect to MongoDB:", err.message);
    process.exit(1);
  }
})();
```

This is an IIFE (Immediately Invoked Function Expression). It connects to MongoDB first, and only then starts listening for requests. This ensures no request is handled before the database is ready. If the connection fails, `process.exit(1)` stops the server.

---

## 5. `routes/players.js` - API Routes

This file defines four routes using Express Router:

**GET /** - Returns all players from the database.
```js
const players = await getDB().collection(COLLECTION).find({}).toArray();
res.json(players);
```
`find({})` with an empty filter returns all documents. `toArray()` converts the MongoDB cursor into a JavaScript array.

**POST /** - Creates a new player.
```js
const { name, sport, team, gender, age, weight } = req.body;
```
Destructuring extracts the fields from the request body. The server validates that `name` and `sport` are present and returns a 400 error if they are missing.

`Number(age)` converts the string value from the request body into a number so MongoDB stores it correctly.

`insertOne()` adds the document and returns the generated `_id`. We respond with status 201 (Created).

**PUT /:id** - Updates an existing player.
```js
const filter = { _id: new ObjectId(req.params.id) };
const update = { $set: { name, sport, team, gender, age: Number(age), weight: Number(weight) } };
```
`new ObjectId(id)` converts the string ID from the URL into a MongoDB ObjectId. The `$set` operator updates only the specified fields without replacing the entire document. If no document matches the filter, we return 404.

**DELETE /:id** - Deletes a player by ID. Returns 404 if the player is not found.

All routes are wrapped in try/catch blocks. If something goes wrong with the database operation, we catch the error and return a 500 status code with the error message.

---

## 6. `index.html` - Page Structure

The HTML file contains:
- A header with the app title and a database connection status indicator
- A stats bar with four cards (total players, sports count, average age, average weight)
- A two-column layout: form panel on the left, player table on the right
- A hidden input field (`editingId`) that stores the ID of the player being edited

Key decisions:

**Hidden input for edit state:**
```html
<input type="hidden" id="editingId" value="" />
```
When the user clicks "Edit" on a player, the player's `_id` is stored in this hidden field. When the form is submitted, `script.js` checks this field to decide whether to send a POST (create) or PUT (update) request. This lets us reuse one form for both operations.

**Script tag at the bottom:**
```html
<script src="script.js"></script>
```
The script is loaded at the end of the body so the DOM is fully built before JavaScript runs. This way `getElementById` calls always find their elements.

**Data attributes on buttons:**
```html
<button data-action="edit" data-id="${player._id}">Edit</button>
```
Instead of using inline `onclick` handlers, we use `data-*` attributes. `script.js` reads these using event delegation (one click listener on the parent table body handles all buttons).

---

## 7. `style.css` - Styling

The CSS uses a simple light theme with a dark header. Key points:

- The reset (`* { margin: 0; padding: 0; box-sizing: border-box; }`) removes default browser spacing so elements are sized consistently.
- The layout uses CSS Grid. The stats bar is a 4-column grid. The main content area is a 2-column grid (form on the left, table on the right).
- On screens smaller than 900px, the grid switches to a single column using a media query.
- The table uses `overflow-x: auto` on its wrapper so it scrolls horizontally on small screens instead of breaking the layout.
- Toast notifications use `max-height` and `opacity` to show and hide. When the `show` class is added by JavaScript, the toast becomes visible.
- Buttons and inputs have simple hover and focus styles using direct color values (no CSS variables).

---

## 8. `script.js` - Frontend Logic

### DOM References

```js
const playerForm = document.getElementById("playerForm");
const inputName = document.getElementById("inputName");
```
All DOM elements are selected once at the top of the file and stored in variables. This avoids querying the DOM repeatedly every time a function runs.

### API Helper Functions

```js
async function fetchAllPlayers() {
  const response = await fetch(API_BASE);
  if (!response.ok) throw new Error("GET failed: " + response.status);
  return response.json();
}
```
The Fetch API is used to make HTTP requests. `fetch()` returns a Promise. We use `async/await` to wait for the response.

`response.ok` is true for status codes 200-299. We check it manually because `fetch` only rejects on network errors (like no internet), not on HTTP error codes like 404 or 500.

Each API operation (fetch, create, update, delete) has its own function. This keeps the code organized and means the API URL only needs to be defined once.

### Rendering the Table

```js
tableBody.innerHTML = players.map((player, i) => `<tr>...</tr>`).join("");
```
`Array.map()` transforms each player object into an HTML string. `.join("")` combines all the strings into one. Setting `innerHTML` once is faster than creating and appending DOM elements in a loop.

**XSS Protection:**
```js
function escapeHTML(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}
```
Before inserting user-provided text into HTML, we escape it. If someone entered `<script>alert('xss')</script>` as a player name, this function converts the angle brackets to safe HTML entities so the script does not execute.

### Form Submit Handler

```js
playerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  ...
});
```
We listen for the `submit` event on the form instead of a click on the button. This also fires when the user presses Enter in a text field.

`e.preventDefault()` stops the browser from reloading the page (the default behavior for form submission).

The submit button is disabled while the request is in progress to prevent double-submission. The `finally` block re-enables it whether the request succeeds or fails.

### Event Delegation

```js
tableBody.addEventListener("click", async (e) => {
  const button = e.target.closest("[data-action]");
  if (!button) return;
  ...
});
```
Instead of attaching click listeners to every Edit and Remove button (which would need to be re-attached every time the table is re-rendered), we attach one listener to the parent `<tbody>`.

When a button is clicked, the click event bubbles up through the DOM. We catch it at the `<tbody>` level and use `event.target.closest("[data-action]")` to find which button was clicked. This is called event delegation.

### Search Filter

```js
searchInput.addEventListener("input", () => {
  const filtered = allPlayers.filter(
    (p) =>
      p.name.toLowerCase().includes(query) ||
      p.sport.toLowerCase().includes(query) ||
      (p.team && p.team.toLowerCase().includes(query))
  );
  renderTable(filtered);
});
```
The search works entirely on the client side. All players are already stored in the `allPlayers` array. `Array.filter()` returns a new array with only the matching players. No network request is needed.

The `input` event fires on every keystroke, so the table updates in real time as the user types.

### In-Memory State

```js
let allPlayers = [];
```
The `allPlayers` array acts as a local cache of the data from the server. After every create, update, or delete operation, we call `loadPlayers()` which fetches fresh data from the API and updates both the array and the table. The search filter reads from this array instead of making additional API calls.

### Initialization

```js
loadPlayers();
```
This is called at the bottom of the file. Since the script tag is at the end of the HTML body, the DOM is already ready when this runs. It fetches all players from the API and renders the table.