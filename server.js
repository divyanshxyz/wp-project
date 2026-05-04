// entry point - loads config, sets up middleware, and starts the server
require("dotenv").config();
const express = require("express");
const path = require("path");
const { connectDB } = require("./db");
const playerRoutes = require("./routes/players");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.use("/api/players", playerRoutes);

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