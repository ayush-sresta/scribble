import { Router } from "express";
import { createRoomController, joinRoomController } from "../controllers/room.controller.js";

const roomRouter = Router();

roomRouter.post("/", createRoomController);
roomRouter.post("/join", joinRoomController);

export default roomRouter;
