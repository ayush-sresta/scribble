import { randomInt, randomUUID } from "node:crypto";
import type { Participant } from "../types/participant.js";
import { Room } from "../models/room.js";
import { GAME_CONFIG } from "../config/game.js";
import type { CreateRoomResponse, JoinRoomResponse } from "../types/room.js";
import { AppError } from "../utils/app-error.js";
import { WORD_BANK } from "../config/words.js";

const ROOM_CODE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateRoomCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = randomInt(0, ROOM_CODE_CHARACTERS.length);
    code += ROOM_CODE_CHARACTERS[randomIndex];
  }
  return code;
}

async function generateUniqueRoomCode(length = 6): Promise<string> {
  while (true) {
    const code = generateRoomCode(length);
    const existingRoom = await Room.findOne({ code });

    if (!existingRoom) {
      return code;
    }
  }
}

function createParticipant(
  username: string,
  role: Participant["role"] = "host",
): Participant {
  const playerId = randomUUID();
  return {
    playerId,
    username,
    role,
  };
}

export async function createRoom(
  username: string,
): Promise<CreateRoomResponse> {
  const code = await generateUniqueRoomCode();
  const participant = createParticipant(username);

  const room = new Room({
    code,
    participants: [participant],
    settings: {
      maxPlayers: GAME_CONFIG.MAX_PLAYERS,
    },
    game: {
      currentRound: 0,
      currentTurn: 0,
      currentArtist: null,
      currentWord: null,
      roundEndsAt: null,
      scores: new Map([[participant.playerId, 0]]),
    },
  });

  await room.save();
  return {
    room: {
      code: room.code,
      status: room.status,
      participants: room.participants,
      settings: {
        maxPlayers: room.settings.maxPlayers,
      },
    },
    participant,
  };
}

export async function joinRoom(
  code: string,
  username: string,
): Promise<JoinRoomResponse> {
  const normalizedCode = code.trim().toUpperCase();
  const room = await Room.findOne({ code: normalizedCode });

  if (!room) {
    throw new AppError(404, "Room not found");
  }

  if (room.status !== "waiting") {
    throw new AppError(400, "Room is not in a joinable state");
  }

  if (room.participants.length >= room.settings.maxPlayers) {
    throw new AppError(400, "Room is full");
  }

  const participant = createParticipant(username.trim(), "player");
  room.participants.push(participant);
  room.game.scores.set(participant.playerId, 0);
  await room.save();

  return {
    room: {
      code: room.code,
      status: room.status,
      settings: {
        maxPlayers: room.settings.maxPlayers,
      },
      participants: room.participants,
    },
    participant,
  };
}

export async function leaveRoom(code: string, playerId: string) {
  const room = await Room.findOne({
    code: code.trim().toUpperCase(),
  });

  if (!room) {
    throw new AppError(404, "Room not found.");
  }

  const participantIndex = room.participants.findIndex(
    (player) => player.playerId === playerId,
  );

  if (participantIndex === -1) {
    throw new AppError(404, "Participant not found.");
  }

  const leavingParticipant = room.participants[participantIndex];

  // Remove participant
  room.participants.splice(participantIndex, 1);

  room.game.scores.delete(playerId);

  // Delete room if nobody remains
  if (room.participants.length === 0) {
    await room.deleteOne();
    return null;
  }

  // Transfer host role if the host leaves
  if (leavingParticipant.role === "host") {
    room.participants[0].role = "host";
  }

  await room.save();

  return {
    code: room.code,
    status: room.status,
    participants: room.participants,
    settings: room.settings,
  };
}

export const startGame = async (code: string, playerId: string) => {
  const room = await Room.findOne({
    code: code.trim().toUpperCase(),
  });

  if (!room) {
    throw new AppError(404, "Room not found.");
  }

  const participant = room.participants.find(
    (player) => player.playerId === playerId,
  );

  if (!participant) {
    throw new AppError(404, "Participant not found.");
  }

  if (participant.role !== "host") {
    throw new AppError(403, "Only the host can start the game.");
  }

  if (room.status !== "waiting") {
    throw new AppError(400, "Game has already started.");
  }

  if (room.participants.length < GAME_CONFIG.MIN_PLAYERS) {
    throw new AppError(400, "At least 2 players are required to start.");
  }

  // Select a random artist.
  const artistIndex = randomInt(0, room.participants.length);
  const artist = room.participants[artistIndex];

  // Select a random word.
  const wordIndex = randomInt(0, WORD_BANK.length);
  const word = WORD_BANK[wordIndex];

  // Initialize the first round.
  room.status = "playing";
  room.game.currentRound = 1;
  room.game.currentTurn = artistIndex;
  room.game.currentArtist = artist.playerId;
  room.game.currentWord = word;
  room.game.roundEndsAt = new Date(Date.now() + GAME_CONFIG.DRAW_TIME * 1000);

  // Ensure every participant has a score.
  for (const player of room.participants) {
    if (!room.game.scores.has(player.playerId)) {
      room.game.scores.set(player.playerId, 0);
    }
  }

  await room.save();

  return {
    code: room.code,
    status: room.status,
    participants: room.participants,
    settings: room.settings,
  };
};
