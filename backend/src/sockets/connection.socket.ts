import { Server, Socket } from "socket.io";

export const registerConnectionHandlers = (
  io: Server,
  socket: Socket,
): void => {
  console.log("Client connected: ", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected: ", socket.id);
  });
};
