import { randomInt, randomUUID } from "node:crypto";
import type { Participant } from "../types/participant.js";
import { Room } from "../models/room.js";
import { GAME_CONFIG } from "../config/game.js";
import type { CreateRoomResponse } from "../types/room.js";

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

function createParticipant(username: string): Participant {
  const playerId = randomUUID();
  return {
    playerId,
    username,
    role: "host" as const,
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
