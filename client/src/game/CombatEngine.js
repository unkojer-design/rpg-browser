const XP_PER_LEVEL = (level) => level * 100;

export function calcDamage(attacker, defender, isPlayer) {
  const base = attacker.attack;
  const def = defender.defense || 0;
  const dmg = Math.max(1, base - Math.floor(def * 0.5) + Phaser.Math.Between(-2, 3));
  const crit = Math.random() < 0.1;
  return { dmg: crit ? Math.floor(dmg * 1.8) : dmg, crit };
}

export function calcXPGain(mob) {
  return mob.xp || 20;
}

export function calcGoldGain(mob) {
  return mob.gold || 5;
}

export function checkLevelUp(character) {
  const needed = XP_PER_LEVEL(character.level);
  if (character.xp >= needed) {
    character.level += 1;
    character.xp -= needed;
    character.max_hp += 10;
    character.hp = character.max_hp;
    character.max_mp += 5;
    character.mp = character.max_mp;
    character.attack += 2;
    character.defense += 1;
    return true;
  }
  return false;
}

export const SKILLS = {
  warrior: [
    { id: "slash",     name: "Tranchée",  mpCost: 0,  dmgMult: 1.4, desc: "Attaque puissante" },
    { id: "shield",    name: "Bouclier",  mpCost: 10, dmgMult: 0,   healSelf: 20, desc: "Se soigne de 20 HP" },
  ],
  mage: [
    { id: "fireball",  name: "Fireball",  mpCost: 15, dmgMult: 2.0, desc: "Boule de feu magique" },
    { id: "icebolt",   name: "Glacée",    mpCost: 10, dmgMult: 1.6, slow: true,   desc: "Réduit ATK ennemi" },
  ],
  rogue: [
    { id: "backstab",  name: "Poignard",  mpCost: 8,  dmgMult: 2.2, critBonus: 0.3, desc: "+30% crit" },
    { id: "smoke",     name: "Fumée",     mpCost: 12, dmgMult: 0,   dodge: true,  desc: "Esquive la prochaine attaque" },
  ],
  paladin: [
    { id: "smite",     name: "Châtiment", mpCost: 12, dmgMult: 1.5, desc: "Dégâts sacrés" },
    { id: "heal",      name: "Soin",      mpCost: 20, dmgMult: 0,   healSelf: 35, desc: "Se soigne de 35 HP" },
  ],
};
