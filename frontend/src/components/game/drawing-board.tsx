"use client";

import { useEffect, useRef, useState } from "react";
import { socket } from "@/lib/socket";

const COLORS = [
  "#000000",
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#FFFFFF",
];

const BRUSH_SIZES = [2, 4, 8, 12, 20];

interface DrawingBoardProps {
  code: string;
}

interface DrawingPoint {
  code: string;
  x: number;
  y: number;
  color: string;
  brushSize: number;
}

interface DrawingEnd {
  code: string;
}

const DrawingBoard = ({ code }: DrawingBoardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const colorRef = useRef("#000000");
  const brushSizeRef = useRef(4);
  const isEraserRef = useRef(false);

  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);

  // Keep drawing settings accessible to canvas listeners.
  useEffect(() => {
    colorRef.current = color;
    brushSizeRef.current = brushSize;
    isEraserRef.current = isEraser;
  }, [color, brushSize, isEraser]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();

      const previousCanvas = document.createElement("canvas");
      previousCanvas.width = canvas.width;
      previousCanvas.height = canvas.height;

      previousCanvas.getContext("2d")?.drawImage(canvas, 0, 0);

      canvas.width = rect.width;
      canvas.height = rect.height;

      context.drawImage(previousCanvas, 0, 0);
    };

    resizeCanvas();

    const getPosition = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();

      return {
        x: (event.clientX - rect.left) / rect.width,
        y: (event.clientY - rect.top) / rect.height,
      };
    };

    const drawPoint = (
      x: number,
      y: number,
      strokeColor: string,
      size: number,
    ) => {
      context.lineWidth = size;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeStyle = strokeColor;

      context.lineTo(x * canvas.width, y * canvas.height);

      context.stroke();
    };

    // LOCAL DRAWING

    const startDrawing = (event: PointerEvent) => {
      if (!socket.connected) return;

      isDrawing.current = true;

      const position = getPosition(event);

      const strokeColor = isEraserRef.current ? "#FFFFFF" : colorRef.current;

      const size = brushSizeRef.current;

      context.beginPath();
      context.moveTo(position.x * canvas.width, position.y * canvas.height);

      context.fillStyle = strokeColor;
      context.beginPath();
      context.arc(
        position.x * canvas.width,
        position.y * canvas.height,
        size / 2,
        0,
        Math.PI * 2,
      );
      context.fill();

      context.beginPath();
      context.moveTo(position.x * canvas.width, position.y * canvas.height);

      const payload: DrawingPoint = {
        code,
        ...position,
        color: strokeColor,
        brushSize: size,
      };

      socket.emit("drawing:start", payload);

      canvas.setPointerCapture(event.pointerId);
    };

    const draw = (event: PointerEvent) => {
      if (!isDrawing.current) return;

      const position = getPosition(event);

      const strokeColor = isEraserRef.current ? "#FFFFFF" : colorRef.current;

      const size = brushSizeRef.current;

      drawPoint(position.x, position.y, strokeColor, size);

      const payload: DrawingPoint = {
        code,
        ...position,
        color: strokeColor,
        brushSize: size,
      };

      socket.emit("drawing:move", payload);
    };

    const stopDrawing = () => {
      if (!isDrawing.current) return;

      isDrawing.current = false;
      context.closePath();

      socket.emit("drawing:end", { code });
    };

    // REMOTE DRAWING

    const handleRemoteStart = (payload: DrawingPoint) => {
      if (payload.code !== code) return;

      context.beginPath();

      context.moveTo(payload.x * canvas.width, payload.y * canvas.height);

      context.fillStyle = payload.color;

      context.beginPath();
      context.arc(
        payload.x * canvas.width,
        payload.y * canvas.height,
        payload.brushSize / 2,
        0,
        Math.PI * 2,
      );
      context.fill();

      context.beginPath();

      context.moveTo(payload.x * canvas.width, payload.y * canvas.height);
    };

    const handleRemoteMove = (payload: DrawingPoint) => {
      if (payload.code !== code) return;

      drawPoint(payload.x, payload.y, payload.color, payload.brushSize);
    };

    const handleRemoteEnd = (payload: DrawingEnd) => {
      if (payload.code !== code) return;

      context.closePath();
    };

    canvas.addEventListener("pointerdown", startDrawing);
    canvas.addEventListener("pointermove", draw);
    canvas.addEventListener("pointerup", stopDrawing);
    canvas.addEventListener("pointercancel", stopDrawing);
    canvas.addEventListener("lostpointercapture", stopDrawing);

    socket.on("drawing:start", handleRemoteStart);
    socket.on("drawing:move", handleRemoteMove);
    socket.on("drawing:end", handleRemoteEnd);

    window.addEventListener("resize", resizeCanvas);

    return () => {
      canvas.removeEventListener("pointerdown", startDrawing);
      canvas.removeEventListener("pointermove", draw);
      canvas.removeEventListener("pointerup", stopDrawing);
      canvas.removeEventListener("pointercancel", stopDrawing);
      canvas.removeEventListener("lostpointercapture", stopDrawing);

      socket.off("drawing:start", handleRemoteStart);
      socket.off("drawing:move", handleRemoteMove);
      socket.off("drawing:end", handleRemoteEnd);

      window.removeEventListener("resize", resizeCanvas);
    };
  }, [code]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4 border-b border-border p-4">
        <div className="flex items-center gap-2">
          {COLORS.map((item) => (
            <button
              key={item}
              onClick={() => {
                setColor(item);
                setIsEraser(false);
              }}
              className={`h-7 w-7 rounded-full border-2 ${
                color === item && !isEraser
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border"
              }`}
              style={{ backgroundColor: item }}
              aria-label={`Select ${item}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          {BRUSH_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => setBrushSize(size)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                brushSize === size
                  ? "border-primary bg-primary/10"
                  : "border-border"
              }`}
              aria-label={`Brush size ${size}`}
            >
              <span
                className="rounded-full bg-foreground"
                style={{ width: size, height: size }}
              />
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsEraser(!isEraser)}
          className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
            isEraser ? "border-primary bg-primary/10" : "border-border"
          }`}
        >
          🧽 Eraser
        </button>

        <button
          onClick={clearCanvas}
          className="ml-auto rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-background"
        >
          Clear 🗑️
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="block h-[450px] w-full touch-none bg-white"
      />
    </section>
  );
};

export default DrawingBoard;
