const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getDB } = require("../db");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "rpg_secret_key_change_in_prod";

router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });

  const db = getDB();
  const existing = db.get("users").find({ username }).value();
  if (existing) return res.status(409).json({ error: "Username already taken" });

  const hash = await bcrypt.hash(password, 10);
  const users = db.get("users").value();
  const userId = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;
  db.get("users").push({ id: userId, username, password_hash: hash }).write();
  const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: "7d" });

  res.json({ token, userId, username });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const db = getDB();
  const user = db.get("users").find({ username }).value();
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, userId: user.id, username: user.username });
});

module.exports = router;
