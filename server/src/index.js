const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { initDB } = require("./db");
const authRoutes = require("./routes/auth");
const characterRoutes = require("./routes/character");
const trainerRoutes = require("./routes/trainer");
const { setupSockets } = require("./sockets");

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || null;

const corsOrigin = CLIENT_URL || /^http:\/\/localhost:\d+$/;

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"],
  },
});

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

initDB();

app.use("/api/auth", authRoutes);
app.use("/api/character", characterRoutes);
app.use("/api/trainer", trainerRoutes);

setupSockets(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
