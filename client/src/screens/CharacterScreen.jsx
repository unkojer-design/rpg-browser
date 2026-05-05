import { useState, useEffect } from "react";
import { getCharacter, createCharacter } from "../api";

const CLASSES = [
  { id: "warrior", label: "Guerrier",  icon: "⚔️",  stats: "HP 120 | ATK 14 | DEF 8  | SPD 7",  desc: "Combattant robuste, ligne de front" },
  { id: "mage",    label: "Mage",      icon: "🔮",  stats: "HP 80  | ATK 16 | DEF 4  | SPD 9",  desc: "Magie dévastatrice, fragile" },
  { id: "rogue",   label: "Voleur",    icon: "🗡️",  stats: "HP 95  | ATK 12 | DEF 5  | SPD 14", desc: "Rapidité et coups critiques" },
  { id: "paladin", label: "Paladin",   icon: "🛡️",  stats: "HP 110 | ATK 11 | DEF 10 | SPD 6",  desc: "Soutien et durabilité" },
];

export default function CharacterScreen({ token, onReady, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [selectedClass, setSelectedClass] = useState("warrior");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCharacter().then((data) => {
      if (data.exists) {
        onReady(data.character);
      } else {
        setCreating(true);
        setLoading(false);
      }
    });
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const data = await createCharacter(name.trim(), selectedClass);
    if (data.error) { setError(data.error); setSubmitting(false); return; }
    onReady(data.character);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-rpg-dark">
        <p className="text-rpg-gold text-[10px] animate-pulse">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-rpg-dark overflow-auto py-8">
      <div className="rpg-panel p-8 w-full max-w-2xl flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-rpg-gold text-sm">Créer votre héros</h2>
          <button className="rpg-btn text-[8px] py-1 px-3" onClick={onLogout}>Déco</button>
        </div>

        <form onSubmit={handleCreate} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label className="text-[8px] text-gray-400">Nom du personnage</label>
            <input
              className="rpg-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Entrez un nom..."
              maxLength={20}
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[8px] text-gray-400">Choisissez une classe</label>
            <div className="grid grid-cols-2 gap-3">
              {CLASSES.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setSelectedClass(c.id)}
                  className={`rpg-panel p-3 text-left flex flex-col gap-1 cursor-pointer transition-all ${
                    selectedClass === c.id
                      ? "border-rpg-gold bg-[#2d1b69]"
                      : "border-rpg-border hover:border-[#7c5cbf]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{c.icon}</span>
                    <span className="text-rpg-gold text-[9px]">{c.label}</span>
                  </div>
                  <p className="text-[7px] text-gray-400">{c.desc}</p>
                  <p className="text-[7px] text-green-400 font-mono">{c.stats}</p>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-[8px] text-center">{error}</p>}

          <button className="rpg-btn text-sm py-3" type="submit" disabled={submitting || !name.trim()}>
            {submitting ? "Création..." : "⚔ Commencer l'aventure"}
          </button>
        </form>
      </div>
    </div>
  );
}
