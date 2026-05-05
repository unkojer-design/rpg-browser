import { useState, useEffect, useRef } from "react";
import { executePlayerMove, executeEnemyMove, canFlee } from "../game/BattleEngine";
import { TYPES } from "../game/PokemonData";
import PokemonPixelSprite from "../game/PokemonSprites";

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
  const spriteSize = isWild ? 120 : 100;
  return (
    <div
      className={`flex flex-col items-center gap-1 ${isShaking ? "sprite-shake" : ""}`}
    >
      {/* Ombre au sol */}
      <div style={{ position: "relative" }}>
        <div style={{
          position: "absolute", bottom: -4, left: "50%",
          transform: "translateX(-50%)",
          width: spriteSize * 0.7, height: 10,
          background: "radial-gradient(ellipse, #00000066, transparent)",
          borderRadius: "50%"
        }} />
        {/* Halo type */}
        <div style={{
          position: "absolute", inset: -8,
          background: `radial-gradient(circle, ${typeColor}33, transparent 70%)`,
          borderRadius: "50%",
          animation: "pulse 2s infinite"
        }} />
        <PokemonPixelSprite pokemon={pokemon} size={spriteSize} />
      </div>
      <span style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 7, color: "#ffffff",
        textShadow: `0 0 8px ${typeColor}`
      }}>{pokemon.name}</span>
      <span style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 6, padding: "2px 6px", borderRadius: 3,
        background: typeColor, color: "#fff",
        boxShadow: `0 0 6px ${typeColor}88`
      }}>{pokemon.type}</span>
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
        fontFamily: "'Press Start 2P', monospace",
        minHeight: 0,
        background: "linear-gradient(180deg, #0a1628 0%, #1a2a4a 40%, #0d2010 100%)",
      }}
    >
      {/* Terrain de combat */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 230 }}>
        {/* Fond ciel */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(180deg, #1a2a5a 0%, #2a4a8a 50%, #3a6a3a 100%)"
        }} />
        {/* Sol ennemi (haut droite) */}
        <div className="absolute" style={{
          right: 40, top: "45%", width: 180, height: 22,
          background: "radial-gradient(ellipse, #5a8a3a 60%, transparent 100%)",
          borderRadius: "50%"
        }} />
        {/* Sol joueur (bas gauche) */}
        <div className="absolute" style={{
          left: 40, bottom: "18%", width: 200, height: 26,
          background: "radial-gradient(ellipse, #6a9a4a 60%, transparent 100%)",
          borderRadius: "50%"
        }} />

        {/* Ennemi (droite, en haut) */}
        <div className="absolute flex flex-col items-end gap-1" style={{ right: 24, top: 16 }}>
          <div className="poke-panel p-2" style={{ minWidth: 180 }}>
            <div className="flex justify-between items-center text-[7px] text-gray-300 mb-1">
              <span className="text-white font-bold">{wild.name}</span>
              <span className="text-poke-yellow">Nv.{wild.level}</span>
            </div>
            <HPBar current={wild.hp} max={wild.maxHp} label="HP" />
          </div>
          <PokemonSprite pokemon={wild} isWild={true} isShaking={shakeWild} />
        </div>

        {/* Joueur (gauche, en bas) */}
        <div className="absolute flex flex-col items-start gap-1" style={{ left: 24, bottom: 16 }}>
          <PokemonSprite pokemon={player} isWild={false} isShaking={shakePlayer} />
          <div className="poke-panel p-2" style={{ minWidth: 190 }}>
            <div className="flex justify-between items-center text-[7px] text-gray-300 mb-1">
              <span className="text-white font-bold">{player.name}</span>
              <span className="text-poke-yellow">Nv.{player.level}</span>
            </div>
            <HPBar current={player.hp} max={player.maxHp} label="HP" />
            <div className="mt-1"><XPBar current={player.xp} max={player.xpNeeded} /></div>
          </div>
        </div>
      </div>

      {/* Boîte bas : log + actions */}
      <div className="flex gap-2 m-2" style={{ minHeight: 150, background: "#0d1a2a", border: "2px solid #2a4a6a", borderRadius: 4, padding: 10 }}>
        {/* Log */}
        <div
          ref={logRef}
          className="flex-1 overflow-y-auto flex flex-col gap-0.5"
          style={{ maxHeight: 130, borderRight: "1px solid #1a3a5a", paddingRight: 8 }}
        >
          {log.map((l, i) => (
            <p key={i} className={`text-[7px] leading-tight ${
              i === log.length - 1 ? "text-white" :
              i === log.length - 2 ? "text-gray-300" : "text-gray-500"
            }`}>
              {i === log.length - 1 ? "▶ " : "  "}{l}
            </p>
          ))}
        </div>

        {/* Boutons */}
        <div className="flex flex-col gap-1.5" style={{ minWidth: 180 }}>
          {phase === "fight" ? (
            <>
              <p className="text-[7px] text-poke-yellow">Que faire ?</p>
              <div className="grid grid-cols-2 gap-1">
                {player.moves.map((move) => {
                  const typeColor = TYPE_COLORS[move.type] || "#ffffff";
                  const noPP = move.pp <= 0;
                  return (
                    <button
                      key={move.id}
                      onClick={() => useMove(move.id)}
                      disabled={busy || noPP}
                      className="text-[6px] py-1.5 px-1 flex flex-col items-center gap-0.5 rounded transition-all"
                      style={{
                        background: noPP ? "#1a1a2a" : `${typeColor}22`,
                        border: `1.5px solid ${noPP ? "#333" : typeColor}`,
                        color: noPP ? "#555" : typeColor,
                        opacity: busy ? 0.6 : 1,
                        cursor: busy || noPP ? "not-allowed" : "pointer",
                      }}
                      title={`PP: ${move.pp}/${move.ppMax}`}
                    >
                      <span className="font-bold">{move.name}</span>
                      <span style={{ opacity: 0.7 }}>{move.type} · {move.pp}PP</span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={flee}
                disabled={busy}
                className="text-[7px] py-1.5 rounded transition-all"
                style={{
                  background: "#2a1a00", border: "1.5px solid #aa8800",
                  color: "#ffcc44", opacity: busy ? 0.5 : 1
                }}
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
