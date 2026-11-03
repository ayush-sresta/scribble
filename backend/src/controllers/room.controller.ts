import type { Request, Response, NextFunction } from "express";
import { createRoom, joinRoom } from "../services/room.service.js";

export const createRoomController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { username } = req.body;

    // Validate username
    if (
      typeof username !== "string" ||
      !username.trim() ||
      username.trim().length > 20
    ) {
      res.status(400).json({
        message: "Username must be between 1 and 20 characters.",
      });
      return;
    }

    // Normalize username
    const normalizedUsername = username.trim();

    // Create room
    const result = await createRoom(normalizedUsername);

    // Send response
    res.status(201).json({
      success: true,
      message: "Room created successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const joinRoomController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { code, username } = req.body;

    // Validate code and username
    if (
      typeof code !== "string" ||
      !code.trim() ||
      code.trim().length !== 6 ||
      typeof username !== "string" ||
      !username.trim() ||
      username.trim().length > 20
    ) {
      res.status(400).json({
        message:
          "Invalid room code or username. Room code must be 6 characters and username must be between 1 and 20 characters.",
      });
      return;
    }

    // Normalize inputs
    const normalizedCode = code.trim().toUpperCase();
    const normalizedUsername = username.trim();

    // Join room
    const result = await joinRoom(normalizedCode, normalizedUsername);

    // Send response
    res.status(200).json({
      success: true,
      message: "Joined room successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
