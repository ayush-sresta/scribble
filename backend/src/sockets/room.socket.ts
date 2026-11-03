import { Server, Socket } from "socket.io";
import {
  CLIENT_EVENTS,
  JoinRoomPayload,
  SERVER_EVENTS,
} from "../types/socket-events.js";
import { Room } from "../models/room.js";

export const registerRoomHandlers = (io: Server, socket: Socket): void => {
  socket.on(CLIENT_EVENTS.JOIN_ROOM, async (payload: JoinRoomPayload) => {
    try {
      const { code, playerId } = payload;

      const room = await Room.findOne({ code: code.trim().toUpperCase() });

      if (!room) {
        socket.emit(SERVER_EVENTS.ROOM_ERROR, {
          message: "Room not found",
        });
        return;
      }

      const participant = room.participants.find(
        (p) => p.playerId === playerId,
      );

      if (!participant) {
        socket.emit(SERVER_EVENTS.ROOM_ERROR, {
          message: "Participant not found in the room",
        });
        return;
      }

      if (room.status !== "waiting") {
        socket.emit(SERVER_EVENTS.ROOM_ERROR, {
          message: "Room is not in a joinable state",
        });
        return;
      }

      await socket.join(room.code);

      socket.emit(SERVER_EVENTS.ROOM_JOINED, {
        code: room.code,
        playerId,
      });

      io.to(room.code).emit(SERVER_EVENTS.ROOM_UPDATED, {
        code: room.code,
        participants: room.participants,
      });
    } catch (error) {
      console.log("Socket room join error", error);

      socket.emit(SERVER_EVENTS.ROOM_ERROR, {
        message: "An error occurred while joining the room",
      });
    }
  });
};
