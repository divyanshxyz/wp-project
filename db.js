// handles mongodb connection and exposes the database instance
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
