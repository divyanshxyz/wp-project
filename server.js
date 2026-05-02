// server.js — The backend "brain" of our Player Details Module
// We use Node.js + Express to handle HTTP requests and MongoDB to store data.
// Express is a lightweight framework that makes routing much cleaner than raw Node.js http module.

const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const path = require("path");

const app = express();
const PORT = 3000;

// --------------------------------------------------------------------------
// DATABASE SETUP
// --------------------------------------------------------------------------
// MongoDB connection string. "playerdb" is the database name we're creating.
// In a real project this would live in a .env file, but for the assignment
// we keep it here so everything is visible and easy to grade.
const MONGO_URI = "mongodb://127.0.0.1:27017";
const DB_NAME = "playerdb";
const COLLECTION = "players";

// We declare `db` at module scope so every route function can access it
// without reconnecting. This is a simple module-level singleton pattern.
let db;

// MongoClient.connect() returns a Promise, so we use async/await to wait
// for the connection before we start accepting requests.
async function connectDB() {
  const client = await MongoClient.connect(MONGO_URI);
  db = client.db(DB_NAME);
  console.log("✅  Connected to MongoDB →", DB_NAME);
}

// --------------------------------------------------------------------------
// MIDDLEWARE
// --------------------------------------------------------------------------
// express.json() is a built-in middleware that parses incoming JSON request
// bodies so we can read req.body in our POST/PUT routes.
app.use(express.json());

// express.static() serves our HTML, CSS, and JS files from the project root.
// The frontend files live next to server.js in this project, not in /public.
app.use(express.static(__dirname));

// Serve the main page explicitly so http://localhost:3000/ loads the app.
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// --------------------------------------------------------------------------
// ROUTES — RESTful API
// Each route maps an HTTP verb + URL path to a specific CRUD operation.
// --------------------------------------------------------------------------

// READ ALL — GET /api/players
// Returns a JSON array of every player in the collection.
app.get("/api/players", async (req, res) => {
  try {
    // find({}) means "no filter" → get everything.
    // toArray() converts the MongoDB cursor into a plain JS array.
    const players = await db.collection(COLLECTION).find({}).toArray();
    res.json(players);
  } catch (err) {
    // If MongoDB throws, we send a 500 (server error) so the frontend knows
    // something went wrong on our end.
    res.status(500).json({ error: err.message });
  }
});

// CREATE — POST /api/players
// Inserts one new player document sent in the request body.
app.post("/api/players", async (req, res) => {
  try {
    const { name, sport, team, gender, age, weight } = req.body;

    // Basic validation — we don't want empty documents in the DB.
    if (!name || !sport) {
      return res.status(400).json({ error: "Name and Sport Type are required." });
    }

    // Build the player object. We add a timestamp so we can sort later.
    const newPlayer = {
      name,
      sport,
      team: team || "Free Agent",
      gender: gender || "",
      age: Number(age) || 0,
      weight: Number(weight) || 0,
      createdAt: new Date(),
    };

    // insertOne() returns a result that contains the auto-generated _id.
    const result = await db.collection(COLLECTION).insertOne(newPlayer);

    // We respond with 201 (Created) and attach the new _id so the frontend
    // can reference this player immediately without re-fetching everything.
    res.status(201).json({ _id: result.insertedId, ...newPlayer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE — PUT /api/players/:id
// Replaces specific fields of an existing player. The :id segment in the
// URL is a route parameter — Express puts it in req.params.id.
app.put("/api/players/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sport, team, gender, age, weight } = req.body;

    // MongoDB uses ObjectId (a 12-byte BSON type) as _id.
    // We must convert the plain string from the URL into an ObjectId
    // before we can query. new ObjectId(id) does this conversion.
    const filter = { _id: new ObjectId(id) };

    // $set only updates the listed fields — it leaves everything else alone.
    // This is safer than replacing the whole document.
    const update = {
      $set: { name, sport, team, gender, age: Number(age), weight: Number(weight) },
    };

    const result = await db.collection(COLLECTION).updateOne(filter, update);

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Player not found." });
    }

    res.json({ message: "Player updated successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE — DELETE /api/players/:id
// Removes one player document by its _id.
app.delete("/api/players/:id", async (req, res) => {
  try {
    const filter = { _id: new ObjectId(req.params.id) };
    const result = await db.collection(COLLECTION).deleteOne(filter);

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Player not found." });
    }

    res.json({ message: "Player deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------------------------------
// START THE SERVER
// --------------------------------------------------------------------------
// We first connect to MongoDB, and only after that succeed do we call
// app.listen(). This guarantees no request is handled before `db` is ready.
// Using an async IIFE (Immediately Invoked Function Expression) keeps the
// startup logic self-contained.
(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀  Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌  Could not connect to MongoDB:", err.message);
    process.exit(1); // Exit with error code so the OS knows it crashed
  }
})();