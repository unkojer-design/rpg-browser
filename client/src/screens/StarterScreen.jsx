import { useState } from "react";
import { createTrainer } from "../api";
import { SPECIES, STARTERS } from "../game/PokemonData";

const TYPE_COLORS = {
  FEU: "#ff6030", EAU: "#6890f0", PLANTE: "#78c850",
  ELECTRIK: "#f8d030", NORMAL: "#a8a878", PSY: "#f85888",
  ROCHE: "#b8a038", TENEBRES: "#705848", DRAGON: "#7038f8",
};

const STARTER_ICONS = {
  bulbizarre: "🌿", carapuce: "💧", salameche: "🔥",
};

export default function StarterScreen({ onReady, onLogout }) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState("bulbizarre");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setSubmitting(true);
    const data = await createTrainer(name.trim(), selected);
    if (data.error) { setError(data.error); setSubmitting(false); return; }
    onReady(data.trainer);
  }

  return (
    <div className="flex items-center justify-center w-screen h-screen overflow-auto py-8"
      style={{ background: "radial-gradient(ellipse at top, #0a1628 0%, #050d1a 100%)" }}>
      {/* Étoiles déco */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        {[...Array(30)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{
              width: (i % 3) + 1, height: (i % 3) + 1,
              left: `${(i * 37 + 11) % 100}%`, top: `${(i * 53 + 7) % 100}%`,
              opacity: 0.3 + (i % 5) * 0.1
            }} />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-4" style={{
        background: "linear-gradient(135deg, #0d1f33 0%, #0a1628 100%)",
        border: "2px solid #2a4a8a", borderRadius: 8,
        boxShadow: "0 0 40px #1a3a8a44"
      }}>
        {/* Header */}
        <div className="text-center py-6 px-8 border-b" style={{ borderColor: "#1a3a6a" }}>
          <div className="text-4xl mb-2">⚡</div>
          <h1 style={{ fontFamily: "'Press Start 2P', monospace", color: "#f0c040", fontSize: 14 }}>
            POKÉMON BROWSER
          </h1>
          <p style={{ fontFamily: "'Press Start 2P', monospace", color: "#6688aa", fontSize: 8, marginTop: 6 }}>
            Choisissez votre nom et votre starter
          </p>
        </div>

        <form onSubmit={handleCreate} className="flex flex-col gap-5 p-8">
          <div className="flex flex-col gap-2">
            <label style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#8899bb" }}>
              Nom du dresseur
            </label>
            <input
              className="poke-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom..."
              maxLength={16}
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-3">
            <label style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#8899bb" }}>
              Choisissez votre starter
            </label>
            <div className="grid grid-cols-3 gap-3">
              {STARTERS.map((id) => {
                const sp = SPECIES[id];
                const typeColor = TYPE_COLORS[sp.type] || "#ffffff";
                const isSelected = selected === id;
                return (
                  <button
                    type="button"
                    key={id}
                    onClick={() => setSelected(id)}
                    className="flex flex-col items-center gap-2 cursor-pointer transition-all"
                    style={{
                      padding: 16, borderRadius: 6,
                      background: isSelected ? `${typeColor}18` : "#0a1628",
                      border: `2px solid ${isSelected ? typeColor : "#1a3a5a"}`,
                      boxShadow: isSelected ? `0 0 16px ${typeColor}44` : "none",
                      transform: isSelected ? "scale(1.03)" : "scale(1)",
                    }}
                  >
                    <div className="text-5xl" style={{
                      filter: isSelected ? `drop-shadow(0 0 8px ${typeColor})` : "none",
                      transition: "filter 0.2s"
                    }}>
                      {STARTER_ICONS[id]}
                    </div>
                    <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#f0c040" }}>
                      {sp.name}
                    </span>
                    <span style={{
                      fontFamily: "'Press Start 2P', monospace", fontSize: 7,
                      padding: "2px 8px", borderRadius: 4,
                      background: typeColor, color: "#fff"
                    }}>
                      {sp.type}
                    </span>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#6688aa", textAlign: "center", lineHeight: 2 }}>
                      HP {sp.hp} · ATK {sp.atk}<br />DEF {sp.def} · VIT {sp.spe}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#ff6666", textAlign: "center" }}>{error}</p>}

          <button
            className="poke-btn py-3"
            type="submit"
            disabled={submitting || !name.trim()}
            style={{ fontSize: 10, letterSpacing: 1 }}
          >
            {submitting ? "⏳ Création..." : "🚀 Commencer l'aventure !"}
          </button>
        </form>

        <div className="px-8 pb-6">
          <button className="poke-btn text-[8px] py-1 w-full"
            style={{ borderColor: "#333", color: "#556677" }}
            onClick={onLogout}>
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}
