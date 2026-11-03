import "dotenv/config";

import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import roomRouter from "./routes/room.route.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { registerSocketHandlers } from "./sockets/index.js";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

registerSocketHandlers(io);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Scribble API is running!",
  });
});

app.use("/api/rooms", roomRouter);

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
