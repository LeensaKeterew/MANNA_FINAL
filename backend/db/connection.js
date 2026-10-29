const { MongoClient } = require("mongodb");

let client = null;
let db = null;

async function ensureIndexes(database) {
  await Promise.all([
    database.collection("users").createIndex({ usernameLower: 1 }, { unique: true }),
    database.collection("users").createIndex({ email: 1 }, { unique: true }),
    database.collection("posts").createIndex({ authorId: 1, createdAt: -1 }),
    database.collection("posts").createIndex({ createdAt: -1 }),
    database.collection("comments").createIndex({ postId: 1, createdAt: 1 }),
    database.collection("albums").createIndex({ ownerId: 1 }),
    database.collection("friends").createIndex({ requester: 1, recipient: 1 }, { unique: true }),
    database.collection("friends").createIndex({ recipient: 1, status: 1 }),
    database.collection("reportReasons").createIndex({ nameLower: 1 }, { unique: true }),
    database.collection("reports").createIndex({ postId: 1, reporterId: 1 }, { unique: true }),
    database.collection("activities").createIndex({ actorId: 1, createdAt: -1 }),
    database.collection("messages").createIndex({ fromId: 1, toId: 1, createdAt: -1 }),
  ]);
}

async function connect() {
  if (db) return db;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Copy backend/.env.example to backend/.env and fill it in.");
  }
  client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
  await client.connect();
  db = client.db(process.env.MONGODB_DB || "manna");
  await ensureIndexes(db);
  return db;
}

function getDb() {
  if (!db) throw new Error("Database is not connected yet.");
  return db;
}

async function close() {
  if (client) await client.close();
  client = null;
  db = null;
}

module.exports = { connect, getDb, close };
