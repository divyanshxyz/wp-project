const express = require("express");
const Player = require("../models/Player");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const players = await Player.find({});
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const player = new Player(req.body);
    const saved = await player.save();
    res.status(201).json(saved);
  } catch (err) {
    if (err.name === "ValidationError") {
      const message = Object.values(err.errors).map((e) => e.message).join(" ");
      return res.status(400).json({ error: message });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updated = await Player.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ error: "Player not found." });
    }

    res.json({ message: "Player updated successfully." });
  } catch (err) {
    if (err.name === "ValidationError") {
      const message = Object.values(err.errors).map((e) => e.message).join(" ");
      return res.status(400).json({ error: message });
    }
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Player.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Player not found." });
    }

    res.json({ message: "Player deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/bulk", async (req, res) => {
  try {
    const { players } = req.body;

    if (!Array.isArray(players) || players.length === 0) {
      return res.status(400).json({ error: "Players array is required." });
    }

    const docs = players.map((p) => new Player(p));

    for (let i = 0; i < docs.length; i++) {
      const err = docs[i].validateSync();
      if (err) {
        const message = Object.values(err.errors).map((e) => e.message).join(" ");
        return res.status(400).json({ error: `Player ${i + 1}: ${message}` });
      }
    }

    const saved = await Player.insertMany(docs);
    res.status(201).json(saved);
  } catch (err) {
    if (err.name === "ValidationError") {
      const message = Object.values(err.errors).map((e) => e.message).join(" ");
      return res.status(400).json({ error: message });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
