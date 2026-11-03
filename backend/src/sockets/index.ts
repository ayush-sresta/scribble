import { Server } from "socket.io";
import { registerConnectionHandlers } from "./connection.socket.js";
import { registerRoomHandlers } from "./room.socket.js";

export const registerSocketHandlers = (io: Server): void => {
  io.on("connection", (socket) => {
    registerConnectionHandlers(io, socket);
    registerRoomHandlers(io, socket);
  });
};
