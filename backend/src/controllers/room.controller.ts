import type { Request, Response, NextFunction } from "express";
import { createRoom } from "../services/room.service.js";

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
