import { useState, useEffect } from "react";
import { createTrainer } from "../api";
import { SPECIES, STARTERS } from "../game/PokemonData";
import PokemonPixelSprite from "../game/PokemonSprites";

const TYPE_COLORS = {
  FEU: "#ff6030", EAU: "#6890f0", PLANTE: "#78c850",
  ELECTRIK: "#f8d030", NORMAL: "#a8a878", PSY: "#f85888",
  ROCHE: "#b8a038", TENEBRES: "#705848", DRAGON: "#7038f8",
};

const DESCRIPTIONS = {
  bulbizarre: "Débutant tranquille. Solide en défense.",
  carapuce: "Rapide sur l'eau. Excellent débutant.",
  salameche: "Fougue et flamme. Pour les courageux.",
};

function Star({ x, y, size, delay }) {
  return (
    <div className="absolute rounded-full bg-white" style={{
      left: x, top: y, width: size, height: size,
      animation: `twinkle ${1.5 + delay}s ease-in-out infinite`,
      animationDelay: `${delay}s`, opacity: 0
    }} />
  );
}

export default function StarterScreen({ onReady, onLogout }) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState("bulbizarre");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [titleVisible, setTitleVisible] = useState(false);
  const [startersVisible, setStartersVisible] = useState(false);
  const [stars] = useState(() =>
    [...Array(50)].map((_, i) => ({
      x: `${(i * 37 + 11) % 100}%`, y: `${(i * 53 + 7) % 100}%`,
      size: (i % 3) + 1, delay: (i * 0.13) % 2.5
    }))
  );

  useEffect(() => {
    setTimeout(() => setTitleVisible(true), 100);
    setTimeout(() => setStartersVisible(true), 600);
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setSubmitting(true);
    const data = await createTrainer(name.trim(), selected);
    if (data.error) { setError(data.error); setSubmitting(false); return; }
    onReady(data.trainer);
  }

  const selectedSp = SPECIES[selected];
  const selectedColor = TYPE_COLORS[selectedSp?.type] || "#ffffff";

  return (
    <div className="flex items-center justify-center w-screen h-screen overflow-auto"
      style={{ background: "radial-gradient(ellipse at 30% 20%, #0d1a40 0%, #060d1a 60%, #000a00 100%)" }}>

      {/* Étoiles scintillantes */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        {stars.map((s, i) => <Star key={i} {...s} />)}
      </div>

      {/* Planète déco */}
      <div className="fixed pointer-events-none" style={{
        zIndex: 0, right: "8%", top: "10%",
        width: 100, height: 100,
        background: "radial-gradient(circle at 35% 35%, #2a4a8a, #0a1428)",
        borderRadius: "50%", boxShadow: "0 0 40px #1a3a8a55, inset -10px -10px 30px #00000088",
        animation: "float 6s ease-in-out infinite"
      }} />

      <div className="relative z-10 w-full max-w-2xl mx-4" style={{
        background: "linear-gradient(160deg, #0c1e3a 0%, #080e1e 100%)",
        border: `2px solid ${selectedColor}44`,
        borderRadius: 12,
        boxShadow: `0 0 60px ${selectedColor}22, 0 0 120px #0a1a4a44`,
        transition: "border-color 0.5s, box-shadow 0.5s"
      }}>

        {/* Titre cinématique */}
        <div className="text-center pt-8 pb-5 px-8" style={{
          borderBottom: `1px solid ${selectedColor}33`,
          transform: titleVisible ? "translateY(0)" : "translateY(-30px)",
          opacity: titleVisible ? 1 : 0,
          transition: "all 0.7s cubic-bezier(0.34,1.56,0.64,1)"
        }}>
          <div style={{ fontSize: 32, animation: "float 3s ease-in-out infinite" }}>⚡</div>
          <h1 style={{
            fontFamily: "'Press Start 2P', monospace",
            color: "#f0c040", fontSize: 16,
            textShadow: "0 0 20px #f0c04088, 0 0 40px #f0c04044",
            letterSpacing: 2, marginTop: 6
          }}>
            POKÉMON BROWSER
          </h1>
          <p style={{ fontFamily: "'Press Start 2P', monospace", color: "#4466aa", fontSize: 7, marginTop: 8 }}>
            ✦ Choisissez votre destin ✦
          </p>
        </div>

        <form onSubmit={handleCreate} className="flex flex-col gap-5 p-7">
          {/* Nom */}
          <div className="flex flex-col gap-2">
            <label style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#7799bb" }}>
              ► Nom du Dresseur
            </label>
            <input
              className="poke-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Entrez votre nom..."
              maxLength={16} required autoFocus
              style={{ borderColor: selectedColor + "66", fontSize: 9 }}
            />
          </div>

          {/* Starters */}
          <div className="flex flex-col gap-3">
            <label style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#7799bb" }}>
              ► Choisissez votre partenaire
            </label>
            <div className="grid grid-cols-3 gap-3">
              {STARTERS.map((id, idx) => {
                const sp = SPECIES[id];
                const typeColor = TYPE_COLORS[sp.type] || "#fff";
                const isSelected = selected === id;
                return (
                  <button
                    type="button" key={id}
                    onClick={() => setSelected(id)}
                    style={{
                      padding: "14px 8px", borderRadius: 10, cursor: "pointer",
                      background: isSelected
                        ? `radial-gradient(circle at 50% 30%, ${typeColor}28, #080e1e 80%)`
                        : "#0a1422",
                      border: `2px solid ${isSelected ? typeColor : "#1a2a4a"}`,
                      boxShadow: isSelected ? `0 0 24px ${typeColor}55, inset 0 0 20px ${typeColor}11` : "none",
                      transform: startersVisible
                        ? isSelected ? "scale(1.07) translateY(-4px)" : "scale(1) translateY(0)"
                        : `translateY(60px)`,
                      opacity: startersVisible ? 1 : 0,
                      transition: `all 0.5s cubic-bezier(0.34,1.56,0.64,1) ${idx * 0.12}s`,
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 6
                    }}
                  >
                    {/* Sprite pixel art */}
                    <div style={{
                      filter: isSelected ? `drop-shadow(0 0 10px ${typeColor}) drop-shadow(0 0 20px ${typeColor}88)` : "none",
                      transition: "filter 0.3s",
                      animation: isSelected ? "float 2s ease-in-out infinite" : "none"
                    }}>
                      <PokemonPixelSprite pokemon={{ speciesId: id, type: sp.type }} size={72} />
                    </div>
                    <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: isSelected ? "#fff" : "#aabbcc" }}>
                      {sp.name}
                    </span>
                    <span style={{
                      fontFamily: "'Press Start 2P', monospace", fontSize: 6,
                      padding: "2px 7px", borderRadius: 4,
                      background: isSelected ? typeColor : typeColor + "44",
                      color: "#fff", boxShadow: isSelected ? `0 0 8px ${typeColor}` : "none",
                      transition: "all 0.3s"
                    }}>
                      {sp.type}
                    </span>
                    <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: isSelected ? "#aaccff" : "#334455", textAlign: "center", lineHeight: 1.8 }}>
                      {DESCRIPTIONS[id]}
                    </p>
                    <div style={{ display: "flex", gap: 4, fontSize: 5, fontFamily: "'Press Start 2P', monospace", color: isSelected ? "#88aacc" : "#2a3a4a" }}>
                      <span>HP{sp.hp}</span><span>·</span>
                      <span>ATK{sp.atk}</span><span>·</span>
                      <span>VIT{sp.spe}</span>
                    </div>
                    {/* Indicateur sélection */}
                    {isSelected && (
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: typeColor, boxShadow: `0 0 8px ${typeColor}`,
                        animation: "pulse 1s infinite"
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#ff6666", textAlign: "center",
              background: "#ff000011", border: "1px solid #ff333344", borderRadius: 4, padding: "8px" }}>
              ⚠ {error}
            </p>
          )}

          <button
            className="poke-btn py-3" type="submit"
            disabled={submitting || !name.trim()}
            style={{
              fontSize: 10, letterSpacing: 1,
              background: submitting ? "#1a2a1a" : `linear-gradient(135deg, ${selectedColor}33, ${selectedColor}11)`,
              borderColor: selectedColor,
              boxShadow: submitting ? "none" : `0 0 20px ${selectedColor}44`,
              color: "#fff", transition: "all 0.3s"
            }}
          >
            {submitting ? "⏳ Création en cours..." : "🚀 Commencer l'aventure !"}
          </button>
        </form>

        <div className="px-7 pb-6">
          <button className="poke-btn text-[7px] py-1 w-full"
            style={{ borderColor: "#222", color: "#334455" }}
            onClick={onLogout}>
            ← Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}
