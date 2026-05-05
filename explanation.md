# Code Explanation - Sports Player Management

This document explains how each file in the project works and why certain decisions were made.

---

## Table of Contents
1. [Project Structure](#1-project-structure)
2. [.env - Configuration](#2-env---configuration)
3. [db.js - Database Connection](#3-dbjs---database-connection)
4. [server.js - Entry Point](#4-serverjs---entry-point)
5. [models/Player.js - Mongoose Model](#5-modelsplayerjs---mongoose-model)
6. [routes/players.js - API Routes](#6-routesplayersjs---api-routes)
7. [index.html - Page Structure](#7-indexhtml---page-structure)
8. [style.css - Styling](#8-stylecss---styling)
9. [script.js - Frontend Logic](#9-scriptjs---frontend-logic)

---

## 1. Project Structure

```
WP Project/
  .env                  # environment variables (MongoDB URL, port)
  db.js                 # Mongoose connection module
  server.js             # main entry point
  models/
    Player.js           # Mongoose schema and model
  routes/
    players.js          # API route handlers
  index.html            # page layout
  style.css             # styling
  script.js             # frontend JavaScript
  package.json          # dependencies
```

The project is split into multiple files so that each file has one clear responsibility. The database connection is in `db.js`, the data schema is in `models/Player.js`, the API routes are in `routes/players.js`, and `server.js` ties everything together. The frontend files (`index.html`, `style.css`, `script.js`) are served as static files by Express.

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
const mongoose = require("mongoose");

async function connectDB(uri, dbName) {
  await mongoose.connect(`${uri}/${dbName}`);
  console.log("Connected to MongoDB:", dbName);
}

module.exports = { connectDB };
```

This file handles the MongoDB connection using Mongoose. `mongoose.connect()` is an asynchronous operation, so we use `async/await` to wait for the connection to be established before doing anything else.

Unlike the raw `mongodb` driver, Mongoose manages its own connection pool internally. Once `mongoose.connect()` is called, all Mongoose models automatically use that connection. There is no need for a `getDB()` function — models access the database directly through Mongoose's internal state.

The connection URI is constructed by combining `MONGO_URI` and `DB_NAME` from the `.env` file (e.g., `mongodb://127.0.0.1:27017/playerdb`).

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

## 5. `models/Player.js` - Mongoose Model

```js
const mongoose = require("mongoose");

const NAME_REGEX = /^[A-Za-z\s]{1,50}$/;

const playerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      maxlength: [50, "Name must not exceed 50 characters."],
      validate: {
        validator: (v) => NAME_REGEX.test(v),
        message: "Full Name must be 1-50 characters and contain only letters and spaces.",
      },
    },
    sport: { type: String, required: [true, "Sport Type is required."], trim: true },
    team: {
      type: String,
      trim: true,
      default: "Free Agent",
      maxlength: [50, "Team Name must not exceed 50 characters."],
      validate: {
        validator: (v) => !v || NAME_REGEX.test(v),
        message: "Team Name must be 1-50 characters and contain only letters and spaces.",
      },
    },
    gender: { type: String, trim: true, default: "" },
    age: { type: Number, default: 0, min: [0, "Age cannot be negative."], max: [100, "Age cannot exceed 100."] },
    weight: { type: Number, default: 0, min: [0, "Weight cannot be negative."], max: [200, "Weight cannot exceed 200 kg."] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Player", playerSchema);
```

This file defines the Mongoose schema and model for player documents. A schema specifies the shape of documents in a collection — their fields, types, defaults, and validation rules.

**Schema-level validation** replaces the manual validation that was previously done in the route handlers. Each field can have:
- `required` — makes the field mandatory, with a custom error message
- `trim` — automatically removes leading/trailing whitespace
- `maxlength` — enforces a maximum string length
- `validate` — runs a custom validator function (here, the regex check)
- `min` / `max` — enforces numeric range limits
- `default` — provides a fallback value if the field is not supplied

The `{ timestamps: true }` option tells Mongoose to automatically add `createdAt` and `updatedAt` fields to every document. These are maintained automatically — `createdAt` is set once on insert, and `updatedAt` is refreshed on every update.

`mongoose.model("Player", playerSchema)` creates a model named `Player`. Mongoose automatically maps this to a MongoDB collection called `players` (lowercase, pluralized). The model provides methods like `.find()`, `.save()`, `.findByIdAndUpdate()`, and `.findByIdAndDelete()` that the route handlers use.

---

## 6. `routes/players.js` - API Routes

This file defines four routes using Express Router. It imports the `Player` model instead of accessing the database directly.

```js
const Player = require("../models/Player");
```

**GET /** - Returns all players from the database.
```js
const players = await Player.find({});
res.json(players);
```
`Player.find({})` returns all documents in the `players` collection as an array of Mongoose documents.

**POST /** - Creates a new player.
```js
const player = new Player(req.body);
const saved = await player.save();
res.status(201).json(saved);
```
`new Player(req.body)` creates a Mongoose document from the request body. `player.save()` validates the data against the schema and inserts it into MongoDB. If validation fails, Mongoose throws a `ValidationError` which is caught and returned as a 400 response.

**PUT /:id** - Updates an existing player.
```js
const updated = await Player.findByIdAndUpdate(req.params.id, req.body, {
  new: true,
  runValidators: true,
});
```
`findByIdAndUpdate` finds a document by its `_id` and applies the updates. The `new: true` option returns the updated document instead of the original. `runValidators: true` is important — without it, Mongoose skips schema validation on updates. If no document matches the ID, `null` is returned and we respond with 404.

**DELETE /:id** - Deletes a player by ID.
```js
const deleted = await Player.findByIdAndDelete(req.params.id);
```
`findByIdAndDelete` finds and removes the document in one operation. Returns `null` if no document matches, triggering a 404 response.

**Error handling:** All routes catch `ValidationError` separately from other errors. Validation errors return 400 with the specific field error messages joined together. Other errors return 500.

---

## 7. `index.html` - Page Structure

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

## 8. `style.css` - Styling

The CSS uses a dark industrial theme with electric amber accents, defined through CSS custom properties in `:root`. Key points:

- The reset (`* { margin: 0; padding: 0; box-sizing: border-box; }`) removes default browser spacing so elements are sized consistently.
- CSS custom properties (variables) centralise all colors, radii, fonts, and transitions in `:root` for easy retheming.
- The layout uses CSS Grid. The stats bar is a 4-column grid. The main content area is a 2-column grid (form on the left, table on the right).
- On screens smaller than 900px, the grid switches to a single column using a media query.
- The table uses `overflow-x: auto` on its wrapper so it scrolls horizontally on small screens instead of breaking the layout.
- Sport badges have per-sport color coding using class-based selectors.
- Toast notifications use `max-height` and `opacity` to show and hide. When the `show` class is added by JavaScript, the toast becomes visible.
- Buttons and inputs use CSS variables for consistent hover and focus styles.

---

## 9. `script.js` - Frontend Logic

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

**Note on XSS:** A client-side `escapeHTML()` function is no longer needed. The Mongoose schema validation (`/^[A-Za-z\s]{1,50}$/`) on `name` and `team` fields ensures that only letters and spaces can be stored in the database. The `sport` and `gender` fields come from fixed `<select>` dropdowns and are not user-typeable. Since no special characters can reach the database, there is no XSS risk when rendering player data in the table.

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