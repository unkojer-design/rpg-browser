import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { io } from "socket.io-client";
import { GameScene } from "../game/GameScene";
import { calcDamage, calcXPGain, calcGoldGain, checkLevelUp, SKILLS } from "../game/CombatEngine";
import { saveCharacter } from "../api";

export default function GameScreen({ token, character: initChar, onLogout }) {
  const gameRef = useRef(null);
  const phaserRef = useRef(null);
  const sceneRef = useRef(null);
  const socketRef = useRef(null);
  const charRef = useRef({ ...initChar });

  const [char, setChar] = useState({ ...initChar });
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [combat, setCombat] = useState(null);
  const [combatLog, setCombatLog] = useState([]);
  const [connectedPlayers, setConnectedPlayers] = useState([]);
  const [notification, setNotification] = useState(null);
  const chatEndRef = useRef(null);

  function showNotif(msg, type = "info") {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  }

  function updateChar(updates) {
    charRef.current = { ...charRef.current, ...updates };
    setChar({ ...charRef.current });
  }

  useEffect(() => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";
    const socket = io(serverUrl, { auth: { token } });
    socketRef.current = socket;

    socket.on("connect_error", (err) => {
      console.error("Socket error:", err.message);
    });

    socket.on("init", ({ self, players }) => {
      setConnectedPlayers([self, ...players]);

      const scene = new GameScene();
      scene.init = () => {};

      const game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: gameRef.current,
        width: gameRef.current.clientWidth,
        height: gameRef.current.clientHeight,
        backgroundColor: "#0d0d1a",
        physics: { default: "arcade", arcade: { gravity: { y: 0 }, debug: false } },
        scene: {
          key: "GameScene",
          create: GameScene.prototype.create,
          update: GameScene.prototype.update,
          init: function () {
            this.socket = socket;
            this.selfData = { ...charRef.current };
            this.onCombatStart = (mob) => startCombat(mob);
            this.chatCallback = (data) => {
              setChatMessages((prev) => [...prev.slice(-49), data]);
            };
            GameScene.prototype.create.call(this);
          },
          extend: GameScene.prototype,
        },
      });

      game.scene.scenes[0].__proto__ = GameScene.prototype;
      phaserRef.current = game;
      sceneRef.current = game.scene.scenes[0];
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

  function startCombat(mob) {
    const c = charRef.current;
    setCombat({
      mob: { ...mob.type, id: mob.id, hp: mob.hp, maxHp: mob.maxHp },
      playerDodge: false,
      enemySlow: false,
    });
    setCombatLog([`⚔ Combat contre ${mob.type.label} !`]);
    socketRef.current?.emit("combat_request", { targetMobId: mob.id, position: { x: c.x, y: c.y } });
  }

  function addLog(msg) {
    setCombatLog((prev) => [...prev.slice(-19), msg]);
  }

  function doAttack(skill) {
    if (!combat) return;
    const c = charRef.current;
    if (skill && skill.mpCost > c.mp) { addLog("❌ Pas assez de MP !"); return; }

    let newMp = c.mp;
    if (skill) newMp = Math.max(0, c.mp - skill.mpCost);

    let effectDmg = 0;
    let healed = false;

    if (skill && skill.healSelf) {
      const newHp = Math.min(c.max_hp, c.hp + skill.healSelf);
      addLog(`💚 ${c.name} se soigne de ${newHp - c.hp} HP.`);
      updateChar({ hp: newHp, mp: newMp });
      healed = true;
    } else {
      const mult = skill ? skill.dmgMult : 1.0;
      const critBonus = skill?.critBonus || 0;
      const { dmg, crit } = calcDamage(c, combat.mob, true);
      effectDmg = Math.floor(dmg * mult + (crit || Math.random() < critBonus ? dmg * 0.8 : 0));
      const critTxt = crit ? " CRITIQUE !" : "";
      addLog(`⚔ ${c.name} inflige ${effectDmg} dégâts.${critTxt}`);
      updateChar({ mp: newMp });
    }

    if (skill?.slow) {
      setCombat((prev) => ({ ...prev, enemySlow: true }));
    }
    if (skill?.dodge) {
      setCombat((prev) => ({ ...prev, playerDodge: true }));
      addLog("💨 Esquive active pour le prochain tour !");
    }

    const newMobHp = Math.max(0, combat.mob.hp - effectDmg);
    setCombat((prev) => ({ ...prev, mob: { ...prev.mob, hp: newMobHp } }));
    sceneRef.current?.damageMob?.(combat.mob.id, effectDmg);

    if (newMobHp <= 0) {
      addLog(`✅ ${combat.mob.label} vaincu !`);
      const xpGain = calcXPGain(combat.mob);
      const goldGain = calcGoldGain(combat.mob);
      const newChar = { ...charRef.current, xp: charRef.current.xp + xpGain, gold: charRef.current.gold + goldGain };
      const leveled = checkLevelUp(newChar);
      updateChar(newChar);
      addLog(`+${xpGain} XP | +${goldGain} or${leveled ? " | NIVEAU " + newChar.level + " !" : ""}`);
      if (leveled) showNotif(`🎉 Niveau ${newChar.level} !`, "success");
      setTimeout(() => {
        setCombat(null);
        saveCharacter(charRef.current);
      }, 1200);
      return;
    }

    setTimeout(() => enemyTurn(), 800);
  }

  function enemyTurn() {
    setCombat((prev) => {
      if (!prev) return null;
      const c = charRef.current;
      if (prev.playerDodge) {
        addLog(`💨 ${c.name} esquive l'attaque !`);
        setCombat((p) => ({ ...p, playerDodge: false }));
        return prev;
      }
      const atkMult = prev.enemySlow ? 0.6 : 1.0;
      const { dmg } = calcDamage(prev.mob, c, false);
      const finalDmg = Math.max(1, Math.floor(dmg * atkMult));
      addLog(`👾 ${prev.mob.label} inflige ${finalDmg} dégâts.`);
      const newHp = Math.max(0, c.hp - finalDmg);
      updateChar({ hp: newHp });
      if (newHp <= 0) {
        addLog(`💀 ${c.name} est mort...`);
        const reviveHp = Math.floor(c.max_hp * 0.3);
        setTimeout(() => {
          updateChar({ hp: reviveHp });
          saveCharacter({ ...charRef.current, hp: reviveHp });
          setCombat(null);
          showNotif("Vous êtes mort... ressuscité avec 30% HP.", "error");
        }, 1500);
      }
      if (prev.enemySlow) return { ...prev, enemySlow: false };
      return prev;
    });
  }

  function sendChat(e) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socketRef.current?.emit("chat", chatInput.trim());
    setChatInput("");
  }

  function flee() {
    addLog("🏃 Vous fuyez le combat !");
    setTimeout(() => setCombat(null), 500);
  }

  const skills = SKILLS[char.class] || [];
  const xpNeeded = char.level * 100;

  return (
    <div className="flex w-screen h-screen bg-rpg-dark overflow-hidden" style={{ fontFamily: "'Press Start 2P', monospace" }}>
      {/* Phaser canvas */}
      <div ref={gameRef} className="flex-1 relative">
        {notification && (
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 rpg-panel px-4 py-2 text-[9px] ${
            notification.type === "success" ? "text-green-400 border-green-600" :
            notification.type === "error" ? "text-red-400 border-red-600" : "text-rpg-gold"
          }`}>
            {notification.msg}
          </div>
        )}
      </div>

      {/* Right panel */}
      <div className="w-64 flex flex-col gap-2 p-2 overflow-hidden">
        {/* Character stats */}
        <div className="rpg-panel p-3 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-rpg-gold text-[8px]">{char.name}</span>
            <span className="text-gray-400 text-[7px]">Nv.{char.level} {char.class}</span>
          </div>
          <StatBar label="HP" current={char.hp} max={char.max_hp} cls="bar-hp" />
          <StatBar label="MP" current={char.mp} max={char.max_mp} cls="bar-mp" />
          <StatBar label="XP" current={char.xp} max={xpNeeded} cls="bar-xp" />
          <div className="flex justify-between text-[7px] text-rpg-gold mt-1">
            <span>⚔ {char.attack}</span>
            <span>🛡 {char.defense}</span>
            <span>💨 {char.speed}</span>
            <span>💰 {char.gold}</span>
          </div>
        </div>

        {/* Connected players */}
        <div className="rpg-panel p-2 flex flex-col gap-1">
          <p className="text-[7px] text-gray-400 mb-1">Joueurs ({connectedPlayers.length})</p>
          {connectedPlayers.map((p, i) => (
            <div key={i} className="flex items-center gap-1 text-[7px]">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
              <span className="text-gray-300 truncate">{p.name}</span>
              <span className="text-gray-500 ml-auto">Nv.{p.level}</span>
            </div>
          ))}
        </div>

        {/* Combat */}
        {combat && (
          <div className="rpg-panel p-3 flex flex-col gap-2 flex-1">
            <p className="text-[8px] text-red-400">⚔ COMBAT</p>
            <div className="text-[7px] text-gray-300">{combat.mob.label}</div>
            <StatBar label="HP" current={combat.mob.hp} max={combat.mob.maxHp} cls="bar-hp" />
            <div className="flex flex-col gap-1 mt-1">
              <button className="rpg-btn text-[7px] py-1" onClick={() => doAttack(null)}>Attaque basique</button>
              {skills.map((sk) => (
                <button
                  key={sk.id}
                  className="rpg-btn text-[7px] py-1"
                  onClick={() => doAttack(sk)}
                  disabled={char.mp < sk.mpCost}
                  title={sk.desc}
                >
                  {sk.name} ({sk.mpCost}MP)
                </button>
              ))}
              <button className="rpg-btn text-[7px] py-1 border-yellow-700 text-yellow-400" onClick={flee}>Fuir</button>
            </div>
            <div className="overflow-y-auto max-h-24 flex flex-col gap-1 mt-1">
              {combatLog.map((l, i) => (
                <p key={i} className="text-[6px] text-gray-300">{l}</p>
              ))}
            </div>
          </div>
        )}

        {/* Chat */}
        <div className="rpg-panel p-2 flex flex-col gap-1 flex-1">
          <p className="text-[7px] text-gray-400 mb-1">Chat</p>
          <div className="overflow-y-auto flex-1 flex flex-col gap-1 max-h-32">
            {chatMessages.map((m, i) => (
              <p key={i} className="text-[6px]">
                <span className="text-rpg-gold">{m.name}: </span>
                <span className="text-gray-300">{m.msg}</span>
              </p>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={sendChat} className="flex gap-1">
            <input
              className="rpg-input text-[7px] py-1 px-2 flex-1"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Message..."
              maxLength={100}
            />
            <button className="rpg-btn text-[7px] py-1 px-2">→</button>
          </form>
        </div>

        <button className="rpg-btn text-[7px] py-1" onClick={onLogout}>Quitter</button>
      </div>
    </div>
  );
}

function StatBar({ label, current, max, cls }) {
  const pct = Math.max(0, Math.min(100, Math.floor((current / max) * 100)));
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between text-[6px] text-gray-400">
        <span>{label}</span>
        <span>{current}/{max}</span>
      </div>
      <div className="w-full bg-gray-900 rounded" style={{ height: 8 }}>
        <div className={cls} style={{ width: `${pct}%`, height: "100%", borderRadius: 2 }} />
      </div>
    </div>
  );
}
