const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { initDB } = require("./db");
const authRoutes = require("./routes/auth");
const characterRoutes = require("./routes/character");
const { setupSockets } = require("./sockets");

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

initDB();

app.use("/api/auth", authRoutes);
app.use("/api/character", characterRoutes);

setupSockets(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
