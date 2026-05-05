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
    <div className="flex items-center justify-center w-screen h-screen bg-poke-dark overflow-auto py-8">
      <div className="poke-panel p-8 w-full max-w-2xl flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-poke-yellow text-base mb-1">🎮 POKÉMON BROWSER</h1>
          <p className="text-gray-400 text-[8px]">Choisissez votre nom et votre starter</p>
        </div>

        <form onSubmit={handleCreate} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label className="text-[8px] text-gray-400">Nom du dresseur</label>
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

          <div className="flex flex-col gap-2">
            <label className="text-[8px] text-gray-400">Choisissez votre starter</label>
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
                    className={`poke-panel p-4 flex flex-col items-center gap-2 cursor-pointer transition-all ${
                      isSelected ? "border-poke-yellow bg-[#1a2a4a]" : "hover:border-blue-500"
                    }`}
                  >
                    {/* Sprite simplifié */}
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                      style={{ background: `${typeColor}33`, border: `2px solid ${typeColor}` }}
                    >
                      {STARTER_ICONS[id]}
                    </div>
                    <span className="text-poke-yellow text-[9px]">{sp.name}</span>
                    <span
                      className="text-[7px] px-2 py-0.5 rounded"
                      style={{ background: typeColor, color: "#fff" }}
                    >
                      {sp.type}
                    </span>
                    <div className="text-[6px] text-gray-400 text-center leading-loose">
                      <span>HP {sp.hp}</span> · <span>ATK {sp.atk}</span><br />
                      <span>DEF {sp.def}</span> · <span>VIT {sp.spe}</span>
                    </div>
                    <p className="text-[6px] text-gray-400 text-center">
                      {sp.moves.slice(0, 2).join(", ")}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="text-red-400 text-[8px] text-center">{error}</p>}

          <button
            className="poke-btn text-sm py-3"
            type="submit"
            disabled={submitting || !name.trim()}
          >
            {submitting ? "Création..." : "🚀 Commencer l'aventure !"}
          </button>
        </form>

        <button className="poke-btn text-[8px] py-1 border-gray-600 text-gray-400" onClick={onLogout}>
          Déconnexion
        </button>
      </div>
    </div>
  );
}
