import { useState, useEffect, useRef } from "react";
import { executePlayerMove, executeEnemyMove, canFlee } from "../game/BattleEngine";
import { TYPES } from "../game/PokemonData";

const TYPE_COLORS = {
  FEU: "#ff6030", EAU: "#6890f0", PLANTE: "#78c850",
  ELECTRIK: "#f8d030", NORMAL: "#a8a878", PSY: "#f85888",
  ROCHE: "#b8a038", TENEBRES: "#705848", DRAGON: "#7038f8",
};

const SPECIES_ICON = {
  salameche: "🦎", reptincel: "🦎", dracaufeu: "🐉",
  carapuce: "🐢", carabaffe: "🐢", tortank: "🐢",
  bulbizarre: "🌿", herbizarre: "🌿", florizarre: "🌸",
  pikachu: "⚡", raichu: "⚡",
  mewtwo: "🔮", dracolosse: "🐲", ronflex: "😴",
  osselait: "💀", ossatueur: "💀", abra: "🔮", kadabra: "🔮",
};

function PokemonSprite({ pokemon, isWild, isShaking }) {
  const typeColor = TYPE_COLORS[pokemon.type] || "#ffffff";
  const icon = SPECIES_ICON[pokemon.speciesId] || "❓";
  return (
    <div className={`flex flex-col items-center gap-1 ${isShaking ? "animate-bounce" : ""}`}>
      <div
        className="rounded-full flex items-center justify-center"
        style={{
          width: isWild ? 80 : 64,
          height: isWild ? 80 : 64,
          background: `radial-gradient(circle at 35% 35%, ${typeColor}99, ${typeColor}22)`,
          border: `3px solid ${typeColor}`,
          fontSize: isWild ? 40 : 32,
          boxShadow: `0 0 20px ${typeColor}66`,
        }}
      >
        {icon}
      </div>
      <span className="text-[8px] text-white">{pokemon.name}</span>
      <span
        className="text-[6px] px-1.5 py-0.5 rounded"
        style={{ background: typeColor, color: "#fff" }}
      >
        {pokemon.type}
      </span>
    </div>
  );
}

function HPBar({ current, max, label }) {
  const pct = Math.max(0, Math.min(100, Math.floor((current / max) * 100)));
  const color = pct > 50 ? "#4caf50" : pct > 20 ? "#ff9800" : "#f44336";
  return (
    <div className="flex flex-col gap-0.5 w-full">
      <div className="flex justify-between text-[6px] text-gray-300">
        <span>{label}</span>
        <span>{current}/{max}</span>
      </div>
      <div className="w-full bg-gray-900 rounded" style={{ height: 8 }}>
        <div
          style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.4s" }}
        />
      </div>
    </div>
  );
}

function XPBar({ current, max }) {
  const pct = Math.max(0, Math.min(100, Math.floor((current / max) * 100)));
  return (
    <div className="flex flex-col gap-0.5 w-full">
      <div className="text-[5px] text-gray-500">XP</div>
      <div className="w-full bg-gray-900 rounded" style={{ height: 4 }}>
        <div
          style={{ width: `${pct}%`, height: "100%", background: "#3498db", borderRadius: 2, transition: "width 0.4s" }}
        />
      </div>
    </div>
  );
}

export default function BattleScreen({ playerPokemon, wildPokemon, onBattleEnd }) {
  const [player, setPlayer] = useState({ ...playerPokemon, moves: playerPokemon.moves.map(m => ({ ...m })) });
  const [wild, setWild] = useState({ ...wildPokemon });
  const [log, setLog] = useState([`Un ${wildPokemon.name} sauvage (Nv.${wildPokemon.level}) apparaît !`]);
  const [busy, setBusy] = useState(false);
  const [shakeWild, setShakeWild] = useState(false);
  const [shakePlayer, setShakePlayer] = useState(false);
  const [phase, setPhase] = useState("fight"); // fight | result
  const [result, setResult] = useState(null); // win | lose | fled
  const logRef = useRef(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [log]);

  function addLogs(newLogs) {
    setLog((prev) => [...prev.slice(-30), ...newLogs]);
  }

  function useMove(moveId) {
    if (busy || phase !== "fight") return;
    setBusy(true);

    // --- Tour joueur ---
    const { logs, newPlayer: p1, newWild: w1, result: res1 } = executePlayerMove(moveId, player, wild);
    addLogs(logs);
    setShakeWild(true);
    setTimeout(() => setShakeWild(false), 500);
    setPlayer(p1);
    setWild(w1);

    if (res1 === "win") {
      setTimeout(() => { setResult("win"); setPhase("result"); setBusy(false); }, 1200);
      return;
    }

    // --- Message attente ennemi ---
    setTimeout(() => {
      addLogs([`⏳ ${w1.name} prépare son attaque...`]);
    }, 900);

    // --- Tour ennemi ---
    setTimeout(() => {
      const { logs: eLogs, newPlayer: p2, newWild: w2, result: res2 } = executeEnemyMove(p1, w1);
      addLogs(eLogs);
      setShakePlayer(true);
      setTimeout(() => setShakePlayer(false), 500);
      setPlayer(p2);
      setWild(w2);
      if (res2 === "lose") {
        setTimeout(() => { setResult("lose"); setPhase("result"); setBusy(false); }, 1000);
      } else {
        setBusy(false);
      }
    }, 1800);
  }

  function flee() {
    if (busy || phase !== "fight") return;
    const escaped = canFlee(player.spe, wild.spe);
    if (escaped) {
      addLogs(["🏃 Vous prenez la fuite !"]);
      setResult("fled");
      setPhase("result");
    } else {
      addLogs(["❌ Impossible de fuir !"]);
    }
  }

  function handleEnd() {
    onBattleEnd(result, player);
  }

  return (
    <div
      className="flex flex-col w-full h-full"
      style={{
        background: "linear-gradient(180deg, #1a3a5c 0%, #0d1f33 50%, #2a3a1a 100%)",
        fontFamily: "'Press Start 2P', monospace",
        minHeight: 0,
      }}
    >
      {/* Terrain de combat */}
      <div className="flex-1 flex items-center justify-around px-8 relative" style={{ minHeight: 220 }}>
        {/* Joueur (gauche) */}
        <div className="flex flex-col items-start gap-2 w-48">
          <PokemonSprite pokemon={player} isWild={false} isShaking={shakePlayer} />
          <div className="poke-panel p-2 w-full">
            <div className="flex justify-between text-[7px] text-gray-300 mb-1">
              <span>{player.name}</span>
              <span className="text-gray-500">Nv.{player.level}</span>
            </div>
            <HPBar current={player.hp} max={player.maxHp} label="HP" />
            <div className="mt-1">
              <XPBar current={player.xp} max={player.xpNeeded} />
            </div>
          </div>
        </div>

        {/* VS */}
        <div className="text-poke-yellow text-xl font-bold opacity-50">VS</div>

        {/* Ennemi (droite) */}
        <div className="flex flex-col items-end gap-2 w-48">
          <div className="poke-panel p-2 w-full">
            <div className="flex justify-between text-[7px] text-gray-300 mb-1">
              <span>{wild.name}</span>
              <span className="text-gray-500">Nv.{wild.level}</span>
            </div>
            <HPBar current={wild.hp} max={wild.maxHp} label="HP" />
          </div>
          <PokemonSprite pokemon={wild} isWild={true} isShaking={shakeWild} />
        </div>
      </div>

      {/* Boîte de texte + actions */}
      <div className="poke-panel m-2 p-3 flex gap-3" style={{ minHeight: 160 }}>
        {/* Log */}
        <div
          ref={logRef}
          className="flex-1 overflow-y-auto flex flex-col gap-1"
          style={{ maxHeight: 130 }}
        >
          {log.map((l, i) => (
            <p key={i} className={`text-[7px] ${i === log.length - 1 ? "text-white" : "text-gray-400"}`}>
              ▶ {l}
            </p>
          ))}
        </div>

        {/* Boutons */}
        <div className="flex flex-col gap-2 w-44">
          {phase === "fight" ? (
            <>
              <p className="text-[7px] text-poke-yellow mb-1">Que faire ?</p>
              <div className="grid grid-cols-2 gap-1">
                {player.moves.map((move) => {
                  const typeColor = TYPE_COLORS[move.type] || "#ffffff";
                  const noPP = move.pp <= 0;
                  return (
                    <button
                      key={move.id}
                      onClick={() => useMove(move.id)}
                      disabled={busy || noPP}
                      className="poke-btn text-[6px] py-1.5 px-1 flex flex-col items-center gap-0.5"
                      style={!noPP ? { borderColor: typeColor, color: typeColor } : {}}
                      title={`PP: ${move.pp}/${move.ppMax}`}
                    >
                      <span>{move.name}</span>
                      <span className="text-[5px] opacity-70">{move.type} · {move.pp}PP</span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={flee}
                disabled={busy}
                className="poke-btn text-[7px] py-1 border-yellow-700 text-yellow-400"
              >
                🏃 Fuir
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 items-center justify-center h-full">
              {result === "win" && (
                <p className="text-green-400 text-[8px] text-center">🏆 Victoire !</p>
              )}
              {result === "lose" && (
                <p className="text-red-400 text-[8px] text-center">💀 Défaite...</p>
              )}
              {result === "fled" && (
                <p className="text-yellow-400 text-[8px] text-center">🏃 Fuite réussie</p>
              )}
              <button onClick={handleEnd} className="poke-btn text-[8px] py-2 px-4 mt-2">
                Continuer →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
