import { Server, Socket } from "socket.io";
import {
  CLIENT_EVENTS,
  DrawingEndPayload,
  DrawingPointPayload,
  JoinRoomPayload,
  LeaveRoomPayload,
  SERVER_EVENTS,
  StartGamePayload,
} from "../types/socket-events.js";
import { Room } from "../models/room.js";
import { leaveRoom, startGame } from "../services/room.service.js";

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

  socket.on(CLIENT_EVENTS.START_GAME, async (payload: StartGamePayload) => {
    try {
      if (
        !payload ||
        typeof payload.code !== "string" ||
        typeof payload.playerId !== "string" ||
        !payload.code.trim() ||
        !payload.playerId.trim()
      ) {
        socket.emit(SERVER_EVENTS.GAME_ERROR, {
          message: "Invalid start game request.",
        });
        return;
      }

      const code = payload.code.trim().toUpperCase();

      if (!socket.rooms.has(code)) {
        socket.emit(SERVER_EVENTS.GAME_ERROR, {
          message: "You are not connected to this room.",
        });
        return;
      }

      const room = await startGame(code, payload.playerId);

      io.to(code).emit(SERVER_EVENTS.GAME_STARTED, {
        code: room.code,
        status: room.status,
      });
    } catch (error) {
      console.error("Socket start game error:", error);

      socket.emit(SERVER_EVENTS.GAME_ERROR, {
        message:
          error instanceof Error ? error.message : "Unable to start game.",
      });
    }
  });

  socket.on(CLIENT_EVENTS.DRAWING_START, (payload: DrawingPointPayload) => {
    if (
      !payload ||
      typeof payload.code !== "string" ||
      typeof payload.x !== "number" ||
      typeof payload.y !== "number" ||
      typeof payload.color !== "string" ||
      typeof payload.brushSize !== "number"
    ) {
      return;
    }

    const code = payload.code.trim().toUpperCase();

    if (
      !socket.rooms.has(code) ||
      payload.x < 0 ||
      payload.x > 1 ||
      payload.y < 0 ||
      payload.y > 1 ||
      !/^#[0-9A-F]{6}$/i.test(payload.color) ||
      payload.brushSize < 1 ||
      payload.brushSize > 30
    ) {
      return;
    }

    socket.to(code).emit(SERVER_EVENTS.DRAWING_START, payload);
  });

  socket.on(CLIENT_EVENTS.DRAWING_MOVE, (payload: DrawingPointPayload) => {
    if (
      !payload ||
      typeof payload.code !== "string" ||
      typeof payload.x !== "number" ||
      typeof payload.y !== "number" ||
      typeof payload.color !== "string" ||
      typeof payload.brushSize !== "number"
    ) {
      return;
    }

    const code = payload.code.trim().toUpperCase();

    if (
      !socket.rooms.has(code) ||
      payload.x < 0 ||
      payload.x > 1 ||
      payload.y < 0 ||
      payload.y > 1 ||
      !/^#[0-9A-F]{6}$/i.test(payload.color) ||
      payload.brushSize < 1 ||
      payload.brushSize > 30
    ) {
      return;
    }

    socket.to(code).emit(SERVER_EVENTS.DRAWING_MOVE, payload);
  });

  socket.on(CLIENT_EVENTS.DRAWING_END, (payload: DrawingEndPayload) => {
    if (!payload || typeof payload.code !== "string" || !payload.code.trim()) {
      return;
    }

    const code = payload.code.trim().toUpperCase();

    if (!socket.rooms.has(code)) return;

    socket.to(code).emit(SERVER_EVENTS.DRAWING_END, { code });
  });

  socket.on("drawing:clear", (payload: { code: string }) => {
    if (!payload || typeof payload.code !== "string" || !payload.code.trim()) {
      return;
    }

    const code = payload.code.trim().toUpperCase();

    if (!socket.rooms.has(code)) return;

    socket.to(code).emit("drawing:clear", { code });
  });
};
