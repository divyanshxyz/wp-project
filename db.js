const mongoose = require("mongoose");

async function connectDB(uri, dbName) {
  await mongoose.connect(`${uri}/${dbName}`);
  console.log("Connected to MongoDB:", dbName);
}

module.exports = { connectDB };
