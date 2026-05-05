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
    const trainer = db.get("trainers").find({ user_id: userId }).value();

    const entityData = trainer || char;
    if (!entityData) {
      socket.emit("error", "No character or trainer found");
      socket.disconnect();
      return;
    }

    const level = trainer
      ? (trainer.team && trainer.team[0] ? trainer.team[0].level : 1)
      : (char.level || 1);

    const playerData = {
      socketId: socket.id,
      userId,
      username,
      name: entityData.name,
      class: trainer ? "trainer" : char.class,
      x: entityData.x,
      y: entityData.y,
      map_id: entityData.map_id,
      hp: trainer ? (trainer.team[0]?.hp ?? 0) : char.hp,
      max_hp: trainer ? (trainer.team[0]?.maxHp ?? 1) : char.max_hp,
      level,
      isTrainer: !!trainer,
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
