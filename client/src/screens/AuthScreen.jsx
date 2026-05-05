import { useState } from "react";
import { login, register } from "../api";

const CLASS_INFO = {
  warrior:  { label: "Guerrier",  icon: "⚔️",  desc: "HP élevé, défense solide" },
  mage:     { label: "Mage",      icon: "🔮",  desc: "Magie puissante, fragile" },
  rogue:    { label: "Voleur",    icon: "🗡️",  desc: "Très rapide, furtif" },
  paladin:  { label: "Paladin",   icon: "🛡️",  desc: "Équilibré, soutien allié" },
};

export default function AuthScreen({ onSuccess }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const fn = mode === "login" ? login : register;
      const data = await fn(username, password);
      if (data.error) { setError(data.error); return; }
      onSuccess(data);
    } catch (err) {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-rpg-dark">
      <div className="rpg-panel p-8 w-full max-w-md flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-rpg-gold text-xl mb-2">⚔ RPG BROWSER ⚔</h1>
          <p className="text-gray-400 text-[8px]">Aventure multijoueur</p>
        </div>

        <div className="flex gap-2">
          {["login", "register"].map((m) => (
            <button
              key={m}
              className={`rpg-btn flex-1 ${mode === m ? "bg-[#4a3f6b] border-rpg-gold" : ""}`}
              onClick={() => setMode(m)}
            >
              {m === "login" ? "Connexion" : "Inscription"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[8px] text-gray-400">Pseudo</label>
            <input
              className="rpg-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Votre pseudo..."
              required
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[8px] text-gray-400">Mot de passe</label>
            <input
              className="rpg-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-red-400 text-[8px] text-center">{error}</p>}
          <button className="rpg-btn" type="submit" disabled={loading}>
            {loading ? "..." : mode === "login" ? "Se connecter" : "Créer le compte"}
          </button>
        </form>
      </div>
    </div>
  );
}
