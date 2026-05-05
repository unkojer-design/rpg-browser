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

// GET /api/trainer — récupère le dresseur
router.get("/", authMiddleware, (req, res) => {
  const db = getDB();
  const trainer = db.get("trainers").find({ user_id: req.user.userId }).value();
  if (!trainer) return res.json({ exists: false });
  res.json({ exists: true, trainer });
});

// POST /api/trainer/create — crée le dresseur avec son starter
router.post("/create", authMiddleware, (req, res) => {
  const { name, starterId } = req.body;
  if (!name || !starterId) return res.status(400).json({ error: "name and starterId required" });

  const VALID_STARTERS = ["bulbizarre", "carapuce", "salameche"];
  if (!VALID_STARTERS.includes(starterId)) return res.status(400).json({ error: "Invalid starter" });

  const db = getDB();
  const existing = db.get("trainers").find({ user_id: req.user.userId }).value();
  if (existing) return res.status(409).json({ error: "Trainer already exists" });

  const trainers = db.get("trainers").value();
  const trainerId = trainers.length > 0 ? Math.max(...trainers.map((t) => t.id)) + 1 : 1;

  const starter = createStarterPokemon(starterId, 5);

  const newTrainer = {
    id: trainerId,
    user_id: req.user.userId,
    name,
    badges: 0,
    money: 500,
    x: 400,
    y: 300,
    map_id: 0,
    team: [starter],
    box: [],
  };
  db.get("trainers").push(newTrainer).write();
  res.json({ trainer: newTrainer });
});

// POST /api/trainer/save — sauvegarde
router.post("/save", authMiddleware, (req, res) => {
  const { x, y, map_id, money, badges, team, box } = req.body;
  const db = getDB();
  db.get("trainers").find({ user_id: req.user.userId }).assign({
    x, y, map_id, money, badges,
    team: team || [],
    box: box || [],
  }).write();
  res.json({ ok: true });
});

function createStarterPokemon(speciesId, level) {
  const SPECIES = {
    salameche:  { name: "Salamèche",  type: "FEU",    hp: 39,  atk: 52,  def: 43,  spe: 65,  moves: ["flammeche", "charge", "brasier", "lance_flamme"],       evolveAt: 16, evolveTo: "reptincel"  },
    carapuce:   { name: "Carapuce",   type: "EAU",    hp: 44,  atk: 48,  def: 65,  spe: 43,  moves: ["pistolet_eau", "charge", "surf"],                        evolveAt: 16, evolveTo: "carabaffe"  },
    bulbizarre: { name: "Bulbizarre", type: "PLANTE", hp: 45,  atk: 49,  def: 49,  spe: 45,  moves: ["fouet_lianes", "charge", "tranch_herbe"],                evolveAt: 16, evolveTo: "herbizarre" },
  };
  const MOVES = {
    flammeche:    { id: "flammeche",    name: "Flammèche",    type: "FEU",      power: 40, pp: 25, ppMax: 25 },
    brasier:      { id: "brasier",      name: "Brasier",      type: "FEU",      power: 70, pp: 15, ppMax: 15 },
    lance_flamme: { id: "lance_flamme", name: "Lance-Flamme", type: "FEU",      power: 90, pp: 15, ppMax: 15 },
    pistolet_eau: { id: "pistolet_eau", name: "Pistolet à O", type: "EAU",      power: 40, pp: 25, ppMax: 25 },
    surf:         { id: "surf",         name: "Surf",         type: "EAU",      power: 90, pp: 15, ppMax: 15 },
    fouet_lianes: { id: "fouet_lianes", name: "Fouet Lianes", type: "PLANTE",   power: 45, pp: 25, ppMax: 25 },
    tranch_herbe: { id: "tranch_herbe", name: "Tranche-Herbe",type: "PLANTE",   power: 55, pp: 25, ppMax: 25 },
    charge:       { id: "charge",       name: "Charge",       type: "NORMAL",   power: 35, pp: 35, ppMax: 35 },
  };

  const sp = SPECIES[speciesId];
  const scaledHp = Math.floor(sp.hp + level * 3);
  return {
    speciesId,
    name: sp.name,
    type: sp.type,
    level,
    xp: 0,
    xpNeeded: level * 50,
    maxHp: scaledHp,
    hp: scaledHp,
    atk: Math.floor(sp.atk + level * 1.5),
    def: Math.floor(sp.def + level * 1.0),
    spe: Math.floor(sp.spe + level * 0.5),
    moves: sp.moves.slice(0, 4).map((mId) => ({ ...MOVES[mId] })),
    evolveAt: sp.evolveAt,
    evolveTo: sp.evolveTo,
  };
}

module.exports = router;
