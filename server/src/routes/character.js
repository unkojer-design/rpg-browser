const express = require("express");
const jwt = require("jsonwebtoken");
const { getDB } = require("../db");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "rpg_secret_key_change_in_prod";

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No token" });
  try {
    req.user = jwt.verify(auth.split(" ")[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

const CLASS_STATS = {
  warrior:  { max_hp: 120, max_mp: 30,  attack: 14, defense: 8,  speed: 7  },
  mage:     { max_hp: 80,  max_mp: 100, attack: 16, defense: 4,  speed: 9  },
  rogue:    { max_hp: 95,  max_mp: 50,  attack: 12, defense: 5,  speed: 14 },
  paladin:  { max_hp: 110, max_mp: 60,  attack: 11, defense: 10, speed: 6  },
};

router.get("/", authMiddleware, (req, res) => {
  const db = getDB();
  const char = db.get("characters").find({ user_id: req.user.userId }).value();
  if (!char) return res.json({ exists: false });
  res.json({ exists: true, character: char });
});

router.post("/create", authMiddleware, (req, res) => {
  const { name, charClass } = req.body;
  if (!name || !charClass) return res.status(400).json({ error: "Name and class required" });
  if (!CLASS_STATS[charClass]) return res.status(400).json({ error: "Invalid class" });

  const db = getDB();
  const existing = db.get("characters").find({ user_id: req.user.userId }).value();
  if (existing) return res.status(409).json({ error: "Character already exists" });

  const stats = CLASS_STATS[charClass];
  const chars = db.get("characters").value();
  const charId = chars.length > 0 ? Math.max(...chars.map((c) => c.id)) + 1 : 1;
  const newChar = {
    id: charId,
    user_id: req.user.userId,
    name,
    class: charClass,
    level: 1, xp: 0,
    hp: stats.max_hp, max_hp: stats.max_hp,
    mp: stats.max_mp, max_mp: stats.max_mp,
    attack: stats.attack, defense: stats.defense, speed: stats.speed,
    gold: 0, x: 400, y: 300, map_id: 0,
    inventory: [], equipment: {},
  };
  db.get("characters").push(newChar).write();
  res.json({ character: newChar });
});

router.post("/save", authMiddleware, (req, res) => {
  const { x, y, map_id, hp, mp, xp, level, gold, inventory, equipment } = req.body;
  const db = getDB();
  db.get("characters").find({ user_id: req.user.userId }).assign({
    x, y, map_id, hp, mp, xp, level, gold,
    inventory: inventory || [],
    equipment: equipment || {},
  }).write();
  res.json({ ok: true });
});

module.exports = router;
