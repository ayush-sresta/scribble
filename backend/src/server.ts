import "dotenv/config";

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import roomRouter from "./routes/room.route.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Scribble API is running!",
  });
});

// *********** APIS ************
app.use("/api/rooms", roomRouter);

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
