import { calcDamage, calcBattleXP, tryEvolve, createPokemon, SPECIES } from "./PokemonData";

// Tour du joueur uniquement — retourne { logs, newPlayer, newWild, result }
export function executePlayerMove(moveId, playerPokemon, wildPokemon) {
  const logs = [];
  let newPlayer = { ...playerPokemon, moves: playerPokemon.moves.map((m) => ({ ...m })) };
  let newWild = { ...wildPokemon };

  const move = newPlayer.moves.find((m) => m.id === moveId);
  if (!move || move.pp <= 0) {
    logs.push("❌ Plus de PP !");
    return { logs, newPlayer, newWild, result: null };
  }

  // Déduction PP
  newPlayer.moves = newPlayer.moves.map((m) => m.id === moveId ? { ...m, pp: m.pp - 1 } : m);

  // Dégâts joueur → sauvage
  const { dmg, eff, crit } = calcDamage(newPlayer, move, newWild);
  newWild.hp = Math.max(0, newWild.hp - dmg);

  let effTxt = "";
  if (eff === 0) effTxt = " Ça n'affecte pas...";
  else if (eff > 1) effTxt = " C'est super efficace !";
  else if (eff < 1) effTxt = " C'est pas très efficace...";
  const critTxt = crit ? " Coup critique !" : "";

  logs.push(`${newPlayer.name} utilise ${move.name} !`);
  logs.push(`Inflige ${dmg} dégâts.${effTxt}${critTxt}`);

  if (newWild.hp <= 0) {
    logs.push(`${newWild.name} est mis KO !`);
    const xpGain = calcBattleXP(newWild);
    logs.push(`${newPlayer.name} gagne ${xpGain} XP !`);
    newPlayer = _addXP(newPlayer, xpGain, logs);
    return { logs, newPlayer, newWild, result: "win" };
  }

  return { logs, newPlayer, newWild, result: null };
}

// Tour de l'ennemi — retourne { logs, newPlayer, newWild, result }
export function executeEnemyMove(playerPokemon, wildPokemon) {
  const logs = [];
  let newPlayer = { ...playerPokemon, moves: playerPokemon.moves.map((m) => ({ ...m })) };
  let newWild = { ...wildPokemon };

  const wildMove = newWild.moves[Math.floor(Math.random() * newWild.moves.length)];
  const { dmg: wildDmg, eff, crit } = calcDamage(newWild, wildMove, newPlayer);
  newPlayer.hp = Math.max(0, newPlayer.hp - wildDmg);

  let effTxt = "";
  if (eff === 0) effTxt = " Ça n'affecte pas...";
  else if (eff > 1) effTxt = " C'est super efficace !";
  else if (eff < 1) effTxt = " C'est pas très efficace...";
  const critTxt = crit ? " Coup critique !" : "";

  logs.push(`${newWild.name} utilise ${wildMove.name} !`);
  logs.push(`Inflige ${wildDmg} dégâts.${effTxt}${critTxt}`);

  if (newPlayer.hp <= 0) {
    logs.push(`${newPlayer.name} est mis KO !`);
    return { logs, newPlayer, newWild, result: "lose" };
  }

  return { logs, newPlayer, newWild, result: null };
}

function _addXP(pokemon, xp, logs) {
  let p = { ...pokemon };
  p.xp += xp;
  while (p.xp >= p.xpNeeded) {
    p.xp -= p.xpNeeded;
    p.level += 1;
    p.xpNeeded = p.level * 50;
    p.maxHp += 5;
    p.hp = p.maxHp;
    p.atk += 2;
    p.def += 1;
    p.spe += 1;
    logs.push(`🎉 ${p.name} passe au niveau ${p.level} !`);

    const evolveTarget = tryEvolve(p);
    if (evolveTarget) {
      logs.push(`✨ ${p.name} évolue en ${SPECIES[evolveTarget]?.name || evolveTarget} !`);
      const newSp = SPECIES[evolveTarget];
      p.speciesId = evolveTarget;
      p.name = newSp.name;
      p.type = newSp.type;
      p.evolveAt = newSp.evolveAt;
      p.evolveTo = newSp.evolveTo;
    }
  }
  return p;
}

export function canFlee(playerSpeed, wildSpeed) {
  return Math.random() < (playerSpeed / (playerSpeed + wildSpeed) * 0.8 + 0.2);
}
