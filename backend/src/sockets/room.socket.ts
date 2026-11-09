import { Server, Socket } from "socket.io";
import {
  CLIENT_EVENTS,
  DrawingEndPayload,
  DrawingPointPayload,
  GameSyncPayload,
  JoinRoomPayload,
  LeaveRoomPayload,
  SERVER_EVENTS,
  StartGamePayload,
} from "../types/socket-events.js";
import { Room } from "../models/room.js";
import { leaveRoom, startGame } from "../services/room.service.js";
import { getWordHint } from "../utils/word.utils.js";

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

      socket.data.playerId = playerId;
      socket.data.roomCode = room.code;

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

      // Verify that this socket belongs to the claimed participant.
      if (socket.data.playerId !== payload.playerId) {
        socket.emit(SERVER_EVENTS.GAME_ERROR, {
          message: "Player identity mismatch.",
        });
        return;
      }

      await startGame(code, payload.playerId);

      // Fetch the initialized game state.
      const room = await Room.findOne({ code });

      if (!room || !room.game.currentArtist || !room.game.currentWord) {
        throw new Error("Game initialization failed.");
      }

      const { currentArtist, currentWord } = room.game;

      // Public information: safe for everyone.
      io.to(code).emit(SERVER_EVENTS.GAME_STARTED, {
        code: room.code,
        status: room.status,
        currentRound: room.game.currentRound,
        currentArtist,
        roundEndsAt: room.game.roundEndsAt,
      });

      // Find every active socket connected to this room.
      const roomSockets = await io.in(code).fetchSockets();

      // Deliver private word information.
      for (const playerSocket of roomSockets) {
        const isArtist = playerSocket.data.playerId === currentArtist;

        playerSocket.emit(SERVER_EVENTS.WORD_SELECTED, {
          ...(isArtist
            ? { word: currentWord }
            : { hint: getWordHint(currentWord) }),
        });
      }
    } catch (error) {
      console.error("Socket start game error:", error);

      socket.emit(SERVER_EVENTS.GAME_ERROR, {
        message:
          error instanceof Error ? error.message : "Unable to start game.",
      });
    }
  });

  socket.on(CLIENT_EVENTS.GAME_SYNC, async (payload: GameSyncPayload) => {
    try {
      if (
        !payload ||
        typeof payload.code !== "string" ||
        typeof payload.playerId !== "string" ||
        !payload.code.trim() ||
        !payload.playerId.trim()
      ) {
        socket.emit(SERVER_EVENTS.GAME_ERROR, {
          message: "Invalid game sync request.",
        });
        return;
      }

      const code = payload.code.trim().toUpperCase();

      const room = await Room.findOne({ code });

      if (!room) {
        socket.emit(SERVER_EVENTS.GAME_ERROR, {
          message: "Room not found.",
        });
        return;
      }

      const participant = room.participants.find(
        (player) => player.playerId === payload.playerId,
      );

      if (!participant) {
        socket.emit(SERVER_EVENTS.GAME_ERROR, {
          message: "Participant not found.",
        });
        return;
      }

      if (
        room.status !== "playing" ||
        !room.game.currentArtist ||
        !room.game.currentWord
      ) {
        socket.emit(SERVER_EVENTS.GAME_ERROR, {
          message: "There is no active game to synchronize.",
        });
        return;
      }

      // Restore this socket's room membership after refresh/reconnection.
      await socket.join(code);

      socket.data.playerId = participant.playerId;
      socket.data.roomCode = code;

      // Send public game information only to this player.
      socket.emit(SERVER_EVENTS.GAME_STARTED, {
        code: room.code,
        status: room.status,
        currentRound: room.game.currentRound,
        currentArtist: room.game.currentArtist,
        roundEndsAt: room.game.roundEndsAt,
      });

      // Send private information only to this player.
      if (participant.playerId === room.game.currentArtist) {
        socket.emit(SERVER_EVENTS.WORD_SELECTED, {
          word: room.game.currentWord,
        });
      } else {
        socket.emit(SERVER_EVENTS.WORD_SELECTED, {
          hint: getWordHint(room.game.currentWord),
        });
      }
    } catch (error) {
      console.error("Game sync error:", error);

      socket.emit(SERVER_EVENTS.GAME_ERROR, {
        message: "Unable to synchronize game.",
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
