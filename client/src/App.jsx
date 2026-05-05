import { useState, useEffect } from "react";
import AuthScreen from "./screens/AuthScreen";
import StarterScreen from "./screens/StarterScreen";
import GameScreen from "./screens/GameScreen";
import { getTrainer } from "./api";

export default function App() {
  const [screen, setScreen] = useState("auth");
  const [token, setToken] = useState(() => localStorage.getItem("pokemon_token"));
  const [trainer, setTrainer] = useState(null);

  useEffect(() => {
    if (token) {
      setScreen("loading");
      getTrainer().then((data) => {
        if (data.exists) {
          setTrainer(data.trainer);
          setScreen("game");
        } else {
          setScreen("starter");
        }
      }).catch(() => setScreen("auth"));
    }
  }, []);

  function onAuthSuccess(data) {
    localStorage.setItem("pokemon_token", data.token);
    setToken(data.token);
    setScreen("starter");
  }

  function onTrainerReady(t) {
    setTrainer(t);
    setScreen("game");
  }

  function onLogout() {
    localStorage.removeItem("pokemon_token");
    setToken(null);
    setTrainer(null);
    setScreen("auth");
  }

  if (screen === "loading") {
    return (
      <div className="flex items-center justify-center w-screen h-screen poke-dark">
        <p className="text-poke-yellow text-[10px] animate-pulse" style={{ fontFamily: "'Press Start 2P', monospace" }}>
          Chargement...
        </p>
      </div>
    );
  }

  if (screen === "auth")    return <AuthScreen onSuccess={onAuthSuccess} isPokemon />;
  if (screen === "starter") return <StarterScreen onReady={onTrainerReady} onLogout={onLogout} />;
  if (screen === "game")    return <GameScreen token={token} trainer={trainer} onLogout={onLogout} />;

  return null;
}
