import type { Participant } from "./participant.js";

export interface RoomResponse {
  code: string;
  status: "waiting" | "playing" | "completed";
  participants: Participant[];
  settings: {
    maxPlayers: number;
  };
}

export interface CreateRoomResponse {
  room: RoomResponse;
  participant: Participant;
}
