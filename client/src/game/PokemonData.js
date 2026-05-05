// Types
export const TYPES = {
  FEU: { color: 0xff6030, label: "Feu", bg: "#ff6030" },
  EAU: { color: 0x6890f0, label: "Eau", bg: "#6890f0" },
  PLANTE: { color: 0x78c850, label: "Plante", bg: "#78c850" },
  ELECTRIK: { color: 0xf8d030, label: "Électrik", bg: "#f8d030" },
  NORMAL: { color: 0xa8a878, label: "Normal", bg: "#a8a878" },
  PSY: { color: 0xf85888, label: "Psy", bg: "#f85888" },
  ROCHE: { color: 0xb8a038, label: "Roche", bg: "#b8a038" },
  TENEBRES: { color: 0x705848, label: "Ténèbres", bg: "#705848" },
  DRAGON: { color: 0x7038f8, label: "Dragon", bg: "#7038f8" },
};

// Efficacités des types (multiplicateur)
export const TYPE_CHART = {
  FEU:      { PLANTE: 2, EAU: 0.5, FEU: 0.5, ROCHE: 0.5 },
  EAU:      { FEU: 2, EAU: 0.5, PLANTE: 0.5 },
  PLANTE:   { EAU: 2, FEU: 0.5, PLANTE: 0.5 },
  ELECTRIK: { EAU: 2, ELECTRIK: 0.5 },
  NORMAL:   { ROCHE: 0.5 },
  PSY:      { PSY: 0.5, TENEBRES: 0 },
  ROCHE:    { FEU: 2, NORMAL: 2, EAU: 0.5, PLANTE: 0.5 },
  TENEBRES: { PSY: 2, TENEBRES: 0.5 },
  DRAGON:   { DRAGON: 2 },
};

export function getEffectiveness(moveType, defType) {
  return TYPE_CHART[moveType]?.[defType] ?? 1;
}

// Capacités
export const MOVES = {
  // Feu
  flammeche:    { id: "flammeche",    name: "Flammèche",    type: "FEU",      power: 40, pp: 25, ppMax: 25, acc: 100, desc: "Crache une petite flamme." },
  brasier:      { id: "brasier",      name: "Brasier",      type: "FEU",      power: 70, pp: 15, ppMax: 15, acc: 100, desc: "Flamme violente." },
  lance_flamme: { id: "lance_flamme", name: "Lance-Flamme", type: "FEU",      power: 90, pp: 15, ppMax: 15, acc: 100, desc: "Brûle l'adversaire." },
  // Eau
  pistolet_eau: { id: "pistolet_eau", name: "Pistolet à O", type: "EAU",      power: 40, pp: 25, ppMax: 25, acc: 100, desc: "Jet d'eau." },
  hydrocanon:   { id: "hydrocanon",   name: "Hydrocanon",   type: "EAU",      power: 110, pp: 5, ppMax: 5,  acc: 80,  desc: "Jet d'eau titanesque." },
  surf:         { id: "surf",         name: "Surf",         type: "EAU",      power: 90, pp: 15, ppMax: 15, acc: 100, desc: "Grosse vague." },
  // Plante
  fouet_lianes: { id: "fouet_lianes", name: "Fouet Lianes", type: "PLANTE",   power: 45, pp: 25, ppMax: 25, acc: 100, desc: "Frappe avec des lianes." },
  tranch_herbe: { id: "tranch_herbe", name: "Tranche-Herbe",type: "PLANTE",   power: 55, pp: 25, ppMax: 25, acc: 95,  desc: "Lames d'herbe tranchantes." },
  lance_soleil: { id: "lance_soleil", name: "Lance-Soleil",  type: "PLANTE",  power: 120, pp: 10, ppMax: 10, acc: 100, desc: "Rayon d'énergie solaire." },
  // Électrik
  eclair:       { id: "eclair",       name: "Éclair",       type: "ELECTRIK", power: 40, pp: 30, ppMax: 30, acc: 100, desc: "Décharge électrique." },
  tonnerre:     { id: "tonnerre",     name: "Tonnerre",     type: "ELECTRIK", power: 90, pp: 15, ppMax: 15, acc: 100, desc: "Puissant tonnerre." },
  // Normal
  charge:       { id: "charge",       name: "Charge",       type: "NORMAL",   power: 35, pp: 35, ppMax: 35, acc: 95,  desc: "Attaque basique." },
  jackpot:      { id: "jackpot",      name: "Jackpot",      type: "NORMAL",   power: 50, pp: 20, ppMax: 20, acc: 100, desc: "Frappe normale." },
  hyper_canon:  { id: "hyper_canon",  name: "Hyper Canon",  type: "NORMAL",   power: 150, pp: 5, ppMax: 5,  acc: 90,  desc: "Attaque ultime." },
  // Psy
  choc_mental:  { id: "choc_mental",  name: "Choc Mental",  type: "PSY",      power: 50, pp: 25, ppMax: 25, acc: 100, desc: "Attaque psy." },
  psyko:        { id: "psyko",        name: "Psyko",        type: "PSY",      power: 90, pp: 10, ppMax: 10, acc: 100, desc: "Puissance mentale." },
  // Roche
  eboulement:   { id: "eboulement",   name: "Éboulement",   type: "ROCHE",    power: 50, pp: 15, ppMax: 15, acc: 90,  desc: "Chute de pierres." },
  // Ténèbres
  mord:         { id: "mord",         name: "Mord",         type: "TENEBRES", power: 60, pp: 25, ppMax: 25, acc: 100, desc: "Mord avec les crocs." },
  // Dragon
  draco_meteor: { id: "draco_meteor", name: "Draco-Météore",type: "DRAGON",   power: 130, pp: 5, ppMax: 5,  acc: 90,  desc: "Météore draconique." },
};

// Espèces de Pokémon (18 espèces)
export const SPECIES = {
  // Starters Feu
  salameche:  { id: "salameche",  name: "Salamèche",  type: "FEU",      hp: 39,  atk: 52,  def: 43,  spe: 65,  color: 0xff6030, moves: ["flammeche", "charge", "brasier", "lance_flamme"],        evolveAt: 16, evolveTo: "reptincel"  },
  reptincel:  { id: "reptincel",  name: "Reptincel",  type: "FEU",      hp: 58,  atk: 64,  def: 58,  spe: 80,  color: 0xff4500, moves: ["flammeche", "brasier", "lance_flamme", "charge"],         evolveAt: 36, evolveTo: "dracaufeu"  },
  dracaufeu:  { id: "dracaufeu",  name: "Dracaufeu",  type: "FEU",      hp: 78,  atk: 84,  def: 78,  spe: 100, color: 0xff2200, moves: ["brasier", "lance_flamme", "charge", "draco_meteor"],       evolveAt: null, evolveTo: null },
  // Starters Eau
  carapuce:   { id: "carapuce",   name: "Carapuce",   type: "EAU",      hp: 44,  atk: 48,  def: 65,  spe: 43,  color: 0x6890f0, moves: ["pistolet_eau", "charge", "surf"],                         evolveAt: 16, evolveTo: "carabaffe"  },
  carabaffe:  { id: "carabaffe",  name: "Carabaffe",  type: "EAU",      hp: 59,  atk: 63,  def: 80,  spe: 58,  color: 0x4070d0, moves: ["pistolet_eau", "surf", "charge", "hydrocanon"],            evolveAt: 36, evolveTo: "tortank"    },
  tortank:    { id: "tortank",    name: "Tortank",    type: "EAU",      hp: 79,  atk: 83,  def: 100, spe: 78,  color: 0x2050b0, moves: ["surf", "hydrocanon", "charge", "eboulement"],              evolveAt: null, evolveTo: null },
  // Starters Plante
  bulbizarre: { id: "bulbizarre", name: "Bulbizarre", type: "PLANTE",   hp: 45,  atk: 49,  def: 49,  spe: 45,  color: 0x78c850, moves: ["fouet_lianes", "charge", "tranch_herbe"],                 evolveAt: 16, evolveTo: "herbizarre" },
  herbizarre: { id: "herbizarre", name: "Herbizarre", type: "PLANTE",   hp: 60,  atk: 62,  def: 63,  spe: 60,  color: 0x58a030, moves: ["fouet_lianes", "tranch_herbe", "charge", "lance_soleil"],  evolveAt: 32, evolveTo: "florizarre" },
  florizarre: { id: "florizarre", name: "Florizarre", type: "PLANTE",   hp: 80,  atk: 82,  def: 83,  spe: 80,  color: 0x389010, moves: ["tranch_herbe", "lance_soleil", "charge", "fouet_lianes"],  evolveAt: null, evolveTo: null },
  // Sauvages
  pikachu:    { id: "pikachu",    name: "Pikachu",    type: "ELECTRIK", hp: 35,  atk: 55,  def: 30,  spe: 90,  color: 0xf8d030, moves: ["eclair", "tonnerre", "charge"],                           evolveAt: 22, evolveTo: "raichu"     },
  raichu:     { id: "raichu",     name: "Raichu",     type: "ELECTRIK", hp: 60,  atk: 90,  def: 55,  spe: 110, color: 0xe0a000, moves: ["eclair", "tonnerre", "jackpot", "charge"],                 evolveAt: null, evolveTo: null },
  mewtwo:     { id: "mewtwo",     name: "Mewtwo",     type: "PSY",      hp: 106, atk: 110, def: 90,  spe: 130, color: 0xf85888, moves: ["psyko", "choc_mental", "hyper_canon", "charge"],           evolveAt: null, evolveTo: null },
  dracolosse: { id: "dracolosse", name: "Dracolosse", type: "DRAGON",   hp: 91,  atk: 134, def: 95,  spe: 80,  color: 0x7038f8, moves: ["draco_meteor", "charge", "hyper_canon", "mord"],          evolveAt: null, evolveTo: null },
  ronflex:    { id: "ronflex",    name: "Ronflex",    type: "NORMAL",   hp: 160, atk: 110, def: 65,  spe: 30,  color: 0xa8a878, moves: ["jackpot", "hyper_canon", "charge"],                       evolveAt: null, evolveTo: null },
  osselait:   { id: "osselait",   name: "Osselait",   type: "NORMAL",   hp: 40,  atk: 40,  def: 40,  spe: 35,  color: 0xd0d0a0, moves: ["charge", "jackpot", "eboulement"],                       evolveAt: 20, evolveTo: "ossatueur"  },
  ossatueur:  { id: "ossatueur",  name: "Ossatueur",  type: "ROCHE",    hp: 70,  atk: 80,  def: 70,  spe: 55,  color: 0xb8a038, moves: ["charge", "eboulement", "jackpot", "hyper_canon"],         evolveAt: null, evolveTo: null },
  abra:       { id: "abra",       name: "Abra",       type: "PSY",      hp: 25,  atk: 20,  def: 15,  spe: 90,  color: 0xf09848, moves: ["choc_mental", "charge"],                                  evolveAt: 16, evolveTo: "kadabra"    },
  kadabra:    { id: "kadabra",    name: "Kadabra",    type: "PSY",      hp: 40,  atk: 35,  def: 30,  spe: 105, color: 0xe08030, moves: ["choc_mental", "psyko", "charge"],                         evolveAt: null, evolveTo: null },
};

// Wilds qui apparaissent dans l'herbe par zone
export const WILD_ENCOUNTERS = [
  ["pikachu", "osselait", "abra", "bulbizarre", "carapuce", "salameche"],
  ["pikachu", "kadabra", "ronflex", "herbizarre", "carabaffe", "reptincel"],
  ["raichu", "ossatueur", "mewtwo", "florizarre", "tortank", "dracaufeu", "dracolosse"],
];

// Starters disponibles
export const STARTERS = ["bulbizarre", "carapuce", "salameche"];

// Crée une instance de Pokémon depuis l'espèce
export function createPokemon(speciesId, level = 5) {
  const sp = SPECIES[speciesId];
  if (!sp) return null;
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

// Tente l'évolution, retourne le nom de l'évolution ou null
export function tryEvolve(pokemon) {
  if (!pokemon.evolveAt || pokemon.level < pokemon.evolveAt) return null;
  const sp = SPECIES[pokemon.evolveTo];
  if (!sp) return null;
  return pokemon.evolveTo;
}

// XP gagné après un combat
export function calcBattleXP(wildPokemon) {
  return Math.floor(wildPokemon.level * 10 + wildPokemon.maxHp * 0.3);
}

// Calcul des dégâts (formule simplifiée Gen 1)
export function calcDamage(attacker, move, defender) {
  const sp = SPECIES[attacker.speciesId];
  const spDef = SPECIES[defender.speciesId];
  const eff = getEffectiveness(move.type, defender.type);
  const lvlFactor = (2 * attacker.level / 5 + 2);
  const raw = Math.floor((lvlFactor * move.power * attacker.atk / defender.def) / 50 + 2);
  const crit = Math.random() < (attacker.spe / 512);
  const randomFactor = (Math.random() * 0.15 + 0.85);
  const dmg = Math.max(1, Math.floor(raw * eff * (crit ? 1.5 : 1) * randomFactor));
  return { dmg, eff, crit };
}
