// defines all CRUD routes for the players collection
const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../db");

const router = express.Router();
const COLLECTION = "players";

router.get("/", async (req, res) => {
  try {
    const players = await getDB().collection(COLLECTION).find({}).toArray();
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, sport, team, gender, age, weight } = req.body;

    if (!name || !sport) {
      return res.status(400).json({ error: "Name and Sport Type are required." });
    }

    const newPlayer = {
      name,
      sport,
      team: team || "Free Agent",
      gender: gender || "",
      age: Number(age) || 0,
      weight: Number(weight) || 0,
      createdAt: new Date(),
    };

    const result = await getDB().collection(COLLECTION).insertOne(newPlayer);
    res.status(201).json({ _id: result.insertedId, ...newPlayer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, sport, team, gender, age, weight } = req.body;
    const filter = { _id: new ObjectId(req.params.id) };
    const update = {
      $set: { name, sport, team, gender, age: Number(age), weight: Number(weight) },
    };

    const result = await getDB().collection(COLLECTION).updateOne(filter, update);

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Player not found." });
    }

    res.json({ message: "Player updated successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const filter = { _id: new ObjectId(req.params.id) };
    const result = await getDB().collection(COLLECTION).deleteOne(filter);

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Player not found." });
    }

    res.json({ message: "Player deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
