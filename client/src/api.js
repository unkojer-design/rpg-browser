const BASE = `${import.meta.env.VITE_SERVER_URL || ""}/api`;

function getToken() {
  return localStorage.getItem("rpg_token");
}

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

export async function register(username, password) {
  const r = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return r.json();
}

export async function login(username, password) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return r.json();
}

export async function getCharacter() {
  const r = await fetch(`${BASE}/character`, { headers: authHeaders() });
  return r.json();
}

export async function createCharacter(name, charClass) {
  const r = await fetch(`${BASE}/character/create`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ name, charClass }),
  });
  return r.json();
}

export async function saveCharacter(data) {
  const r = await fetch(`${BASE}/character/save`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return r.json();
}
