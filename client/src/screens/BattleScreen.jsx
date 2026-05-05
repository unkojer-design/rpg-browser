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
  const [phase, setPhase] = useState("fight");
  const [result, setResult] = useState(null);
  const [flashColor, setFlashColor] = useState(null);
  const [attackFx, setAttackFx] = useState(null);
  const [evolving, setEvolving] = useState(false);
  const [confetti] = useState(() =>
    [...Array(28)].map((_, i) => ({
      left: `${(i * 31 + 7) % 100}%`,
      delay: (i * 0.18) % 2.5,
      dur: 1.8 + (i % 5) * 0.4,
      color: ["#f0c040","#44ff88","#44aaff","#ff6644","#ff44cc","#ffffff"][i % 6],
      size: 5 + (i % 4) * 3,
    }))
  );
  const logRef = useRef(null);

  // Flash d'entrée
  useEffect(() => {
    setFlashColor("#ffffff");
    setTimeout(() => setFlashColor(null), 400);
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [log]);

  function addLogs(newLogs) {
    setLog((prev) => [...prev.slice(-30), ...newLogs]);
  }

  function flashAttack(side, color) {
    setAttackFx({ side, color });
    setTimeout(() => setAttackFx(null), 350);
  }

  function useMove(moveId) {
    if (busy || phase !== "fight") return;
    setBusy(true);

    const move = player.moves.find(m => m.id === moveId);
    const moveColor = TYPE_COLORS[move?.type] || "#ffffff";

    // Flash attaque joueur
    flashAttack("wild", moveColor);

    // --- Tour joueur ---
    const { logs, newPlayer: p1, newWild: w1, result: res1 } = executePlayerMove(moveId, player, wild);
    addLogs(logs);
    setShakeWild(true);
    setTimeout(() => setShakeWild(false), 500);
    setPlayer(p1);
    setWild(w1);

    if (res1 === "win") {
      // Vérifier évolution
      const evolved = p1.name !== playerPokemon.name;
      if (evolved) {
        setEvolving(true);
        setTimeout(() => {
          setEvolving(false);
          setResult("win"); setPhase("result"); setBusy(false);
        }, 2500);
      } else {
        setTimeout(() => { setResult("win"); setPhase("result"); setBusy(false); }, 1200);
      }
      return;
    }

    // --- Message attente ennemi ---
    setTimeout(() => {
      addLogs([`⏳ ${w1.name} prépare son attaque...`]);
    }, 900);

    // --- Flash + Tour ennemi ---
    setTimeout(() => {
      const wildMove = w1.moves[0];
      const wildColor = TYPE_COLORS[wildMove?.type] || "#ff4444";
      flashAttack("player", wildColor);

      const { logs: eLogs, newPlayer: p2, newWild: w2, result: res2 } = executeEnemyMove(p1, w1);
      addLogs(eLogs);
      setShakePlayer(true);
      setTimeout(() => setShakePlayer(false), 500);
      setPlayer(p2);
      setWild(w2);
      if (res2 === "lose") {
        setFlashColor("#440000");
        setTimeout(() => setFlashColor(null), 600);
        setTimeout(() => { setResult("lose"); setPhase("result"); setBusy(false); }, 1200);
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
      {/* Flash plein écran */}
      {flashColor && (
        <div className="absolute inset-0 z-50 pointer-events-none" style={{
          background: flashColor, opacity: 0.55,
          animation: "encounter-flash 0.4s ease-out forwards"
        }} />
      )}

      {/* Écran évolution */}
      {evolving && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center" style={{
          background: "radial-gradient(circle, #ffffff 0%, #ffff88 40%, #ff8800 100%)",
          animation: "level-up 0.6s infinite"
        }}>
          <div style={{ fontSize: 40, animation: "spin 0.5s linear infinite" }}>✨</div>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: "#222", marginTop: 16 }}>
            Évolution !
          </p>
        </div>
      )}

      {/* Terrain de combat */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 230 }}>
        {/* Fond panoramique animé */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(120deg, #0a1a3a, #1a3a6a, #0a2a1a, #1a4a2a, #0a1a3a)",
          backgroundSize: "300% 300%",
          animation: "battle-bg-pan 12s ease infinite"
        }} />
        {/* Montagnes décor */}
        <svg className="absolute bottom-0 w-full" style={{ height: "45%", opacity: 0.35 }} viewBox="0 0 800 200" preserveAspectRatio="none">
          <polygon points="0,200 120,60 240,120 380,30 500,100 640,20 800,80 800,200" fill="#1a3a2a" />
          <polygon points="0,200 80,100 160,140 280,70 420,120 560,50 700,110 800,90 800,200" fill="#0f2a1a" />
        </svg>
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

        {/* Flash attaque sur ennemi */}
        {attackFx?.side === "wild" && (
          <div className="absolute inset-0 pointer-events-none z-20" style={{
            background: `radial-gradient(circle at 70% 30%, ${attackFx.color}88, transparent 60%)`,
            animation: "encounter-flash 0.35s ease-out forwards"
          }} />
        )}
        {/* Flash attaque sur joueur */}
        {attackFx?.side === "player" && (
          <div className="absolute inset-0 pointer-events-none z-20" style={{
            background: `radial-gradient(circle at 30% 70%, ${attackFx.color}88, transparent 60%)`,
            animation: "encounter-flash 0.35s ease-out forwards"
          }} />
        )}

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
                <>
                  {/* Confettis */}
                  <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 60 }}>
                    {confetti.map((c, i) => (
                      <div key={i} className="absolute" style={{
                        left: c.left, top: "-10px",
                        width: c.size, height: c.size,
                        background: c.color,
                        borderRadius: i % 2 === 0 ? "50%" : "2px",
                        animation: `confetti-fall ${c.dur}s ease-in ${c.delay}s infinite`,
                        boxShadow: `0 0 4px ${c.color}`
                      }} />
                    ))}
                  </div>
                  <div className="victory" style={{
                    padding: "12px 20px", borderRadius: 8,
                    background: "linear-gradient(135deg, #1a3a0a, #0a2a00)",
                    border: "2px solid #f0c040",
                  }}>
                    <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#f0c040", textAlign: "center" }}>
                      🏆 VICTOIRE !
                    </p>
                  </div>
                </>
              )}
              {result === "lose" && (
                <div style={{ padding: "12px 20px", borderRadius: 8,
                  background: "linear-gradient(135deg, #3a0a0a, #1a0000)",
                  border: "2px solid #ff3333" }}>
                  <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#ff4444", textAlign: "center" }}>
                    💀 Défaite...
                  </p>
                </div>
              )}
              {result === "fled" && (
                <div style={{ padding: "10px 16px", borderRadius: 6,
                  background: "#1a1a00", border: "2px solid #aaaa00" }}>
                  <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#ffff44", textAlign: "center" }}>
                    🏃 Fuite réussie
                  </p>
                </div>
              )}
              <button onClick={handleEnd} className="poke-btn text-[8px] py-2 px-4 mt-2 slide-up">
                Continuer →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
