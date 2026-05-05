import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { io } from "socket.io-client";
import { PokemonScene } from "../game/PokemonScene";
import { saveTrainer } from "../api";
import BattleScreen from "./BattleScreen";

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
      <div className="w-64 flex flex-col gap-2 p-2 overflow-hidden" style={{ background: "#0a120a" }}>
        {/* Dresseur */}
        <div className="poke-panel p-3 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-poke-yellow text-[8px]">🎮 {trainer.name}</span>
            <span className="text-gray-400 text-[6px]">💰 {trainer.money}</span>
          </div>
          {/* Pokémon de tête */}
          {leadPokemon && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {{
                    salameche: "🦎", reptincel: "🦎", dracaufeu: "🐉",
                    carapuce: "🐢", carabaffe: "🐢", tortank: "🐢",
                    bulbizarre: "🌿", herbizarre: "🌿", florizarre: "🌸",
                    pikachu: "⚡", raichu: "⚡", mewtwo: "🔮",
                    dracolosse: "🐲", ronflex: "😴", osselait: "💀",
                    ossatueur: "💀", abra: "🔮", kadabra: "🔮",
                  }[leadPokemon.speciesId] || "❓"}
                </span>
                <div className="flex flex-col">
                  <span className="text-[8px] text-white">{leadPokemon.name}</span>
                  <span className="text-[6px] text-gray-400">Nv.{leadPokemon.level}</span>
                </div>
                <span
                  className="text-[6px] ml-auto px-1 py-0.5 rounded"
                  style={{ background: TYPE_COLORS[leadPokemon.type] || "#888", color: "#fff" }}
                >
                  {leadPokemon.type}
                </span>
              </div>
              <HPBar current={leadPokemon.hp} max={leadPokemon.maxHp} />
              <XPBar current={leadPokemon.xp} max={leadPokemon.xpNeeded} />
            </div>
          )}
        </div>

        {/* Équipe */}
        <button
          className="poke-btn text-[7px] py-1"
          onClick={() => setShowTeam(!showTeam)}
        >
          {showTeam ? "▲ Cacher équipe" : "▼ Voir équipe"}
        </button>
        {showTeam && (
          <div className="poke-panel p-2 flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: 160 }}>
            {trainer.team.map((p, i) => (
              <div key={i} className="flex items-center gap-1 text-[6px] border-b border-gray-800 pb-1">
                <span className="text-[9px]">
                  {{
                    salameche: "🦎", reptincel: "🦎", dracaufeu: "🐉",
                    carapuce: "🐢", carabaffe: "🐢", tortank: "🐢",
                    bulbizarre: "🌿", herbizarre: "🌿", florizarre: "🌸",
                    pikachu: "⚡", raichu: "⚡", mewtwo: "🔮",
                    dracolosse: "🐲", ronflex: "😴", osselait: "💀",
                    ossatueur: "💀", abra: "🔮", kadabra: "🔮",
                  }[p.speciesId] || "❓"}
                </span>
                <div className="flex flex-col flex-1">
                  <span className="text-white">{p.name} <span className="text-gray-500">Nv.{p.level}</span></span>
                  <div className="w-full bg-gray-900 rounded" style={{ height: 4 }}>
                    <div
                      style={{
                        width: `${Math.max(0, Math.floor(p.hp / p.maxHp * 100))}%`,
                        height: "100%",
                        background: p.hp / p.maxHp > 0.5 ? "#4caf50" : p.hp / p.maxHp > 0.2 ? "#ff9800" : "#f44336",
                        borderRadius: 2
                      }}
                    />
                  </div>
                </div>
                <span className="text-gray-400">{p.hp}/{p.maxHp}</span>
              </div>
            ))}
          </div>
        )}

        {/* Joueurs connectés */}
        <div className="poke-panel p-2 flex flex-col gap-1">
          <p className="text-[7px] text-gray-400 mb-1">Dresseurs ({connectedPlayers.length})</p>
          {connectedPlayers.map((p, i) => (
            <div key={i} className="flex items-center gap-1 text-[7px]">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
              <span className="text-gray-300 truncate">{p.name}</span>
              <span className="text-gray-500 ml-auto">Nv.{p.level}</span>
            </div>
          ))}
        </div>

        {/* Chat */}
        <div className="poke-panel p-2 flex flex-col gap-1 flex-1">
          <p className="text-[7px] text-gray-400 mb-1">Chat</p>
          <div className="overflow-y-auto flex-1 flex flex-col gap-1 max-h-32">
            {chatMessages.map((m, i) => (
              <p key={i} className="text-[6px]">
                <span className="text-poke-yellow">{m.name}: </span>
                <span className="text-gray-300">{m.msg}</span>
              </p>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={sendChat} className="flex gap-1">
            <input
              className="poke-input text-[7px] py-1 px-2 flex-1"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Message..."
              maxLength={100}
            />
            <button className="poke-btn text-[7px] py-1 px-2">→</button>
          </form>
        </div>

        <button className="poke-btn text-[7px] py-1" onClick={onLogout}>Quitter</button>
      </div>
    </div>
  );
}

function HPBar({ current, max }) {
  const pct = Math.max(0, Math.min(100, Math.floor((current / max) * 100)));
  const color = pct > 50 ? "#4caf50" : pct > 20 ? "#ff9800" : "#f44336";
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between text-[6px] text-gray-400">
        <span>HP</span>
        <span>{current}/{max}</span>
      </div>
      <div className="w-full bg-gray-900 rounded" style={{ height: 8 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

function XPBar({ current, max }) {
  const pct = Math.max(0, Math.min(100, Math.floor((current / max) * 100)));
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-[5px] text-gray-500">XP</div>
      <div className="w-full bg-gray-900 rounded" style={{ height: 4 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "#3498db", borderRadius: 2, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}
