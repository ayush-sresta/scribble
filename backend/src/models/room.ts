import mongoose from "mongoose";
import type { Participant } from "../types/participant.js";
import type { GameState } from "../types/game.js";

export interface Room {
  code: string;
  status: "waiting" | "playing" | "completed";
  participants: Participant[];
  settings: {
    maxPlayers: number;
  };
  game: GameState;
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

const gameSchema = new mongoose.Schema<GameState>(
  {
    currentRound: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentTurn: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentArtist: {
      type: String,
      default: null,
    },
    currentWord: {
      type: String,
      default: null,
    },
    roundEndsAt: {
      type: Date,
      default: null,
    },
    scores: {
      type: Map,
      of: Number,
      default: {},
    },
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
    game: {
      type: gameSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  },
);

export const Room = mongoose.model<Room>("Room", roomSchema);
