import { AppError } from "../utils/app-error.js";

export const errorMiddleware = (
  err: any,
  req: any,
  res: any,
  next: any,
): void => {
  console.log(err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
};
