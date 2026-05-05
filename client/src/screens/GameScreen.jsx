import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { io } from "socket.io-client";
import { PokemonScene } from "../game/PokemonScene";
import { saveTrainer } from "../api";
import BattleScreen from "./BattleScreen";
import PokemonPixelSprite from "../game/PokemonSprites";

const TYPE_COLORS = {
  FEU: "#ff6030", EAU: "#6890f0", PLANTE: "#78c850",
  ELECTRIK: "#f8d030", NORMAL: "#a8a878", PSY: "#f85888",
  ROCHE: "#b8a038", TENEBRES: "#705848", DRAGON: "#7038f8",
};

export default function GameScreen({ token, trainer: initTrainer, onLogout }) {
  const gameRef = useRef(null);
  const phaserRef = useRef(null);
  const sceneRef = useRef(null);
  const socketRef = useRef(null);
  const trainerRef = useRef({ ...initTrainer, team: initTrainer.team.map(p => ({ ...p, moves: p.moves.map(m => ({ ...m })) })) });

  const [trainer, setTrainer] = useState(trainerRef.current);
  const [battle, setBattle] = useState(null); // { wildPokemon }
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [connectedPlayers, setConnectedPlayers] = useState([]);
  const [notification, setNotification] = useState(null);
  const [showTeam, setShowTeam] = useState(false);
  const chatEndRef = useRef(null);

  function showNotif(msg, type = "info") {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  }

  function updateTrainer(updates) {
    trainerRef.current = { ...trainerRef.current, ...updates };
    setTrainer({ ...trainerRef.current });
  }

  useEffect(() => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";
    const socket = io(serverUrl, { auth: { token } });
    socketRef.current = socket;

    socket.on("connect_error", (err) => console.error("Socket error:", err.message));

    socket.on("init", ({ self, players }) => {
      setConnectedPlayers([self, ...players]);

      class BootedScene extends PokemonScene {
        init() {
          this.socket = socket;
          this.trainerData = { ...trainerRef.current };
          this.existingPlayers = players;
          this.onWildEncounter = (wildPokemon) => {
            setBattle({ wildPokemon });
          };
          this.onHeal = () => {
            const healedTeam = trainerRef.current.team.map(p => ({ ...p, hp: p.maxHp }));
            updateTrainer({ team: healedTeam });
            saveTrainer({ ...trainerRef.current, team: healedTeam });
            showNotif("💊 Pokémon soignés au Centre Pokémon !", "success");
          };
          this.chatCallback = (data) => {
            setChatMessages((prev) => [...prev.slice(-49), data]);
          };
        }
      }

      const game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: gameRef.current,
        width: gameRef.current.clientWidth,
        height: gameRef.current.clientHeight,
        backgroundColor: "#1a3a1a",
        physics: { default: "arcade", arcade: { gravity: { y: 0 }, debug: false } },
        scene: BootedScene,
      });

      phaserRef.current = game;
      setTimeout(() => {
        sceneRef.current = game.scene.getScene("PokemonScene");
      }, 500);
    });

    socket.on("player_joined", (p) => {
      setConnectedPlayers((prev) => {
        if (prev.find((x) => x.socketId === p.socketId)) return prev;
        return [...prev, p];
      });
    });
    socket.on("player_left", ({ socketId }) => {
      setConnectedPlayers((prev) => prev.filter((p) => p.socketId !== socketId));
    });

    return () => {
      socket.disconnect();
      if (phaserRef.current) { phaserRef.current.destroy(true); phaserRef.current = null; }
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  function onBattleEnd(result, updatedPokemon) {
    // Met à jour le premier Pokémon de l'équipe avec les nouvelles stats
    const newTeam = trainerRef.current.team.map((p, i) =>
      i === 0 ? { ...updatedPokemon } : p
    );

    // Si KO : soigner à 30% HP
    const finalTeam = newTeam.map((p) => {
      if (p.hp <= 0) return { ...p, hp: Math.max(1, Math.floor(p.maxHp * 0.3)) };
      return p;
    });

    updateTrainer({ team: finalTeam });
    saveTrainer({ ...trainerRef.current, team: finalTeam });

    if (result === "win") {
      const evolved = updatedPokemon.name !== trainerRef.current.team[0]?.name;
      if (evolved) showNotif(`✨ ${updatedPokemon.name} a évolué !`, "success");
      else showNotif(`🏆 Victoire ! Nv.${updatedPokemon.level}`, "success");
    } else if (result === "lose") {
      showNotif("💀 KO ! Pokémon soigné d'urgence.", "error");
    }

    setBattle(null);
    setTimeout(() => sceneRef.current?.endBattle?.(), 100);
  }

  function sendChat(e) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socketRef.current?.emit("chat", chatInput.trim());
    setChatInput("");
  }

  const leadPokemon = trainer.team[0];

  return (
    <div
      className="flex w-screen h-screen overflow-hidden"
      style={{ fontFamily: "'Press Start 2P', monospace", background: "#0d1a0d" }}
    >
      {/* Zone Phaser */}
      <div ref={gameRef} className="flex-1 relative">
        {notification && (
          <div
            className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 poke-panel px-4 py-2 text-[9px] ${
              notification.type === "success" ? "text-green-400 border-green-500" :
              notification.type === "error" ? "text-red-400 border-red-600" : "text-poke-yellow"
            }`}
          >
            {notification.msg}
          </div>
        )}

        {/* Overlay combat (par-dessus le canvas) */}
        {battle && leadPokemon && (
          <div className="absolute inset-0 z-40">
            <BattleScreen
              playerPokemon={leadPokemon}
              wildPokemon={battle.wildPokemon}
              onBattleEnd={onBattleEnd}
            />
          </div>
        )}
      </div>

      {/* Panneau droit */}
      <div className="w-64 flex flex-col gap-2 p-2 overflow-hidden" style={{
        background: "linear-gradient(180deg, #060e06 0%, #0a140a 100%)",
        borderLeft: "2px solid #1a3a1a"
      }}>

        {/* Carte dresseur */}
        <div style={{
          background: "linear-gradient(135deg, #0f2a0f, #1a3a1a)",
          border: "2px solid #2a5a2a", borderRadius: 6,
          padding: 10, boxShadow: "0 0 12px #0a2a0a"
        }}>
          <div className="flex justify-between items-center mb-2">
            <span style={{ fontSize: 8, color: "#f0c040", fontFamily: "'Press Start 2P', monospace" }}>
              🎮 {trainer.name}
            </span>
            <span style={{ fontSize: 6, color: "#88aa88" }}>💰{trainer.money}</span>
          </div>

          {leadPokemon && (
            <div className="flex items-center gap-2">
              {/* Mini sprite */}
              <div style={{
                background: `radial-gradient(circle, ${TYPE_COLORS[leadPokemon.type] || "#444"}44, transparent)`,
                borderRadius: 6, padding: 2, flexShrink: 0
              }}>
                <PokemonPixelSprite pokemon={leadPokemon} size={44} />
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <div className="flex justify-between">
                  <span style={{ fontSize: 7, color: "#fff" }}>{leadPokemon.name}</span>
                  <span style={{ fontSize: 6, color: "#f0c040" }}>Nv.{leadPokemon.level}</span>
                </div>
                <span style={{
                  fontSize: 6, padding: "1px 5px", borderRadius: 3, alignSelf: "flex-start",
                  background: TYPE_COLORS[leadPokemon.type] || "#888", color: "#fff"
                }}>{leadPokemon.type}</span>
                <HPBar current={leadPokemon.hp} max={leadPokemon.maxHp} />
                <XPBar current={leadPokemon.xp} max={leadPokemon.xpNeeded} />
              </div>
            </div>
          )}
        </div>

        {/* Équipe */}
        <button className="poke-btn text-[7px] py-1" onClick={() => setShowTeam(!showTeam)}>
          {showTeam ? "▲ Équipe" : "▼ Équipe"} ({trainer.team.length})
        </button>
        {showTeam && (
          <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: 150 }}>
            {trainer.team.map((p, i) => {
              const hpPct = p.hp / p.maxHp;
              const hpColor = hpPct > 0.5 ? "#44cc44" : hpPct > 0.2 ? "#ffaa00" : "#ff3333";
              return (
                <div key={i} className="flex items-center gap-1" style={{
                  background: "#0a1a0a", border: "1px solid #1a3a1a",
                  borderRadius: 4, padding: "4px 6px"
                }}>
                  <PokemonPixelSprite pokemon={p} size={28} />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span style={{ fontSize: 6, color: "#fff" }}>{p.name} <span style={{ color: "#888" }}>Nv.{p.level}</span></span>
                    <div style={{ height: 4, background: "#1a1a1a", borderRadius: 2, marginTop: 2 }}>
                      <div style={{
                        width: `${Math.max(0, hpPct * 100)}%`, height: "100%",
                        background: `linear-gradient(90deg, ${hpColor}aa, ${hpColor})`,
                        borderRadius: 2, transition: "width 0.3s"
                      }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 5, color: "#668866" }}>{p.hp}/{p.maxHp}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Joueurs connectés */}
        <div style={{ background: "#0a1a0a", border: "1px solid #1a3a1a", borderRadius: 4, padding: 8 }}>
          <p style={{ fontSize: 6, color: "#668866", marginBottom: 4 }}>
            🟢 {connectedPlayers.length} dresseur{connectedPlayers.length > 1 ? "s" : ""} en ligne
          </p>
          {connectedPlayers.map((p, i) => (
            <div key={i} className="flex items-center gap-1" style={{ marginBottom: 3 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#44ff44", boxShadow: "0 0 4px #44ff44" }} />
              <span style={{ fontSize: 6, color: "#aaccaa", flex: 1 }} className="truncate">{p.name}</span>
              <span style={{ fontSize: 5, color: "#557755" }}>Nv.{p.level}</span>
            </div>
          ))}
        </div>

        {/* Chat */}
        <div className="flex flex-col gap-1 flex-1" style={{ background: "#060e06", border: "1px solid #1a3a1a", borderRadius: 4, padding: 8, minHeight: 0 }}>
          <p style={{ fontSize: 6, color: "#668866", marginBottom: 4 }}>💬 Chat</p>
          <div className="overflow-y-auto flex-1 flex flex-col gap-1" style={{ maxHeight: 110 }}>
            {chatMessages.map((m, i) => (
              <p key={i} style={{ fontSize: 6 }}>
                <span style={{ color: "#f0c040" }}>{m.name}: </span>
                <span style={{ color: "#99bb99" }}>{m.msg}</span>
              </p>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={sendChat} className="flex gap-1" style={{ marginTop: 4 }}>
            <input
              className="poke-input flex-1"
              style={{ fontSize: 7, padding: "4px 8px" }}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Message..."
              maxLength={100}
            />
            <button className="poke-btn" style={{ fontSize: 8, padding: "4px 8px" }}>→</button>
          </form>
        </div>

        <button className="poke-btn text-[7px] py-1" style={{ borderColor: "#552222", color: "#ff6666" }} onClick={onLogout}>
          ⏻ Quitter
        </button>
      </div>
    </div>
  );
}

function HPBar({ current, max }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const isCrit = pct <= 20;
  const gradient = pct > 50
    ? "linear-gradient(90deg, #228822, #44ff44)"
    : pct > 20
    ? "linear-gradient(90deg, #cc6600, #ffaa00)"
    : "linear-gradient(90deg, #880000, #ff3333)";
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between" style={{ fontSize: 5, color: "#668866" }}>
        <span>HP</span>
        <span style={{ color: isCrit ? "#ff4444" : "#668866" }}>{current}/{max}</span>
      </div>
      <div style={{ height: 7, background: "#0a0a0a", borderRadius: 3, border: "1px solid #1a3a1a", overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: gradient, borderRadius: 3,
          transition: "width 0.4s",
          boxShadow: isCrit ? "0 0 6px #ff3333" : "none",
          animation: isCrit ? "hp-critical 0.8s infinite" : "none"
        }} />
      </div>
    </div>
  );
}

function XPBar({ current, max }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  return (
    <div className="flex flex-col gap-0.5">
      <div style={{ fontSize: 5, color: "#446688" }}>XP</div>
      <div style={{ height: 4, background: "#0a0a0a", borderRadius: 2, border: "1px solid #1a2a3a", overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: "linear-gradient(90deg, #1155aa, #44aaff)",
          borderRadius: 2, transition: "width 0.5s"
        }} />
      </div>
    </div>
  );
}
