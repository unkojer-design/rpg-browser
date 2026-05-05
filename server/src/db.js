const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const path = require("path");
const fs = require("fs");

const DB_DIR = path.join(__dirname, "../../data");
const DB_PATH = path.join(DB_DIR, "rpg.json");

let db;

function initDB() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  const adapter = new FileSync(DB_PATH);
  db = low(adapter);
  db.defaults({ users: [], characters: [] }).write();
  console.log("DB initialized at", DB_PATH);
  return db;
}

function getDB() {
  return db;
}

module.exports = { initDB, getDB };
