import { Server, Socket } from "socket.io";
import {
  CLIENT_EVENTS,
  JoinRoomPayload,
  LeaveRoomPayload,
  SERVER_EVENTS,
} from "../types/socket-events.js";
import { Room } from "../models/room.js";
import { leaveRoom } from "../services/room.service.js";

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

  socket.on(CLIENT_EVENTS.LEAVE_ROOM, async (payload: LeaveRoomPayload) => {
    try {
      if (
        !payload ||
        typeof payload.code !== "string" ||
        typeof payload.playerId !== "string" ||
        !payload.code.trim() ||
        !payload.playerId.trim()
      ) {
        socket.emit(SERVER_EVENTS.ROOM_ERROR, {
          message: "Invalid leave room request.",
        });
        return;
      }

      const code = payload.code.trim().toUpperCase();

      // Make sure this socket belongs to the room.
      if (!socket.rooms.has(code)) {
        socket.emit(SERVER_EVENTS.ROOM_ERROR, {
          message: "You are not connected to this room.",
        });
        return;
      }

      const room = await leaveRoom(code, payload.playerId);

      // Remove this socket from the Socket.IO room.
      await socket.leave(code);

      // Notify remaining participants.
      if (room) {
        io.to(code).emit(SERVER_EVENTS.ROOM_UPDATED, {
          code: room.code,
          participants: room.participants,
        });
      }

      // Confirm to the leaving participant.
      socket.emit(SERVER_EVENTS.ROOM_LEFT, { code });
    } catch (error) {
      console.error("Socket room leave error:", error);

      socket.emit(SERVER_EVENTS.ROOM_ERROR, {
        message: "Unable to leave room.",
      });
    }
  });
};
