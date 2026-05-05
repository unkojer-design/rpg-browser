const jwt = require("jsonwebtoken");
const { getDB } = require("./db");

const JWT_SECRET = process.env.JWT_SECRET || "rpg_secret_key_change_in_prod";

const connectedPlayers = new Map();

function setupSockets(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("No token"));
    try {
      socket.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const { userId, username } = socket.user;
    console.log(`[+] ${username} connected (${socket.id})`);

    const db = getDB();
    const char = db.get("characters").find({ user_id: userId }).value();
    if (!char) {
      socket.emit("error", "No character found");
      socket.disconnect();
      return;
    }

    const playerData = {
      socketId: socket.id,
      userId,
      username,
      name: char.name,
      class: char.class,
      x: char.x,
      y: char.y,
      map_id: char.map_id,
      hp: char.hp,
      max_hp: char.max_hp,
      level: char.level,
    };

    connectedPlayers.set(socket.id, playerData);

    socket.emit("init", {
      self: playerData,
      players: Array.from(connectedPlayers.values()).filter((p) => p.socketId !== socket.id),
    });

    socket.broadcast.emit("player_joined", playerData);

    socket.on("move", ({ x, y }) => {
      const p = connectedPlayers.get(socket.id);
      if (!p) return;
      p.x = x;
      p.y = y;
      socket.broadcast.emit("player_moved", { socketId: socket.id, x, y });
    });

    socket.on("chat", (msg) => {
      if (typeof msg !== "string" || msg.length > 200) return;
      const p = connectedPlayers.get(socket.id);
      io.emit("chat_message", { name: p?.name || username, msg });
    });

    socket.on("combat_request", ({ targetMobId, position }) => {
      const p = connectedPlayers.get(socket.id);
      if (!p) return;
      io.emit("combat_started", {
        initiator: socket.id,
        initiatorName: p.name,
        targetMobId,
        position,
      });
    });

    socket.on("combat_action", (data) => {
      socket.broadcast.emit("combat_action", { socketId: socket.id, ...data });
    });

    socket.on("save_position", ({ x, y, map_id }) => {
      db.get("characters").find({ user_id: userId }).assign({ x, y, map_id }).write();
      const p = connectedPlayers.get(socket.id);
      if (p) { p.x = x; p.y = y; p.map_id = map_id; }
    });

    socket.on("disconnect", () => {
      console.log(`[-] ${username} disconnected`);
      connectedPlayers.delete(socket.id);
      io.emit("player_left", { socketId: socket.id });
    });
  });
}

module.exports = { setupSockets };
