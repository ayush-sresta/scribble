import mongoose from "mongoose";
import { Participant } from "../types/participant.js";

interface Room {
  code: string;
  status: "waiting" | "playing" | "completed";
  participants: Participant[];
  settings: {
    maxPlayers: number;
  };
}

const participantSchema = new mongoose.Schema<Participant>(
  {
    playerId: { type: String, required: true },
    username: { type: String, required: true, trim: true },
    role: { type: String, enum: ["host", "player"], required: true },
  },
  {
    _id: false,
  },
);

const roomSchema = new mongoose.Schema<Room>(
  {
    code: { type: String, unique: true, required: true },
    status: {
      type: String,
      enum: ["waiting", "playing", "completed"],
      default: "waiting",
      required: true,
    },
    participants: {
      type: [participantSchema],
      default: [],
      required: true,
    },
    settings: {
      maxPlayers: {
        type: Number,
        default: 8,
        min: 2,
        max: 8,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  },
);

export const Room = mongoose.model<Room>("Room", roomSchema);
