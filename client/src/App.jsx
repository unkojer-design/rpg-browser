import { useState, useEffect } from "react";
import AuthScreen from "./screens/AuthScreen";
import CharacterScreen from "./screens/CharacterScreen";
import GameScreen from "./screens/GameScreen";

export default function App() {
  const [screen, setScreen] = useState("auth");
  const [token, setToken] = useState(() => localStorage.getItem("rpg_token"));
  const [user, setUser] = useState(null);
  const [character, setCharacter] = useState(null);

  useEffect(() => {
    if (token) {
      setScreen("character");
    }
  }, []);

  function onAuthSuccess(data) {
    localStorage.setItem("rpg_token", data.token);
    setToken(data.token);
    setUser({ userId: data.userId, username: data.username });
    setScreen("character");
  }

  function onCharacterReady(char) {
    setCharacter(char);
    setScreen("game");
  }

  function onLogout() {
    localStorage.removeItem("rpg_token");
    setToken(null);
    setUser(null);
    setCharacter(null);
    setScreen("auth");
  }

  if (screen === "auth") return <AuthScreen onSuccess={onAuthSuccess} />;
  if (screen === "character")
    return <CharacterScreen token={token} onReady={onCharacterReady} onLogout={onLogout} />;
  if (screen === "game")
    return <GameScreen token={token} character={character} onLogout={onLogout} />;

  return null;
}
