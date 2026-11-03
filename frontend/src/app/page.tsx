"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";

const API_URL = "http://localhost:5000";

export default function Home() {
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    socket.on("room:joined", (data) => {
      setMessage(`Successfully joined room ${data.code}!`);
      console.log("Room joined:", data);
    });

    socket.on("room:updated", (data) => {
      console.log("Room updated:", data);
    });

    socket.on("room:error", (data) => {
      setMessage(data.message);
    });

    return () => {
      socket.off("room:joined");
      socket.off("room:updated");
      socket.off("room:error");
    };
  }, []);

  const handleJoinRoom = async () => {
    try {
      setMessage("Joining room...");

      const response = await fetch(`${API_URL}/api/rooms/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, username }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message);
        return;
      }

      const { room, participant } = result.data;

      if (!socket.connected) {
        socket.connect();
      }

      socket.emit("room:join", {
        code: room.code,
        playerId: participant.playerId,
      });
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong.");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">Scribble</h1>

      <input
        placeholder="Room code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="border p-2"
      />

      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="border p-2"
      />

      <button
        onClick={handleJoinRoom}
        className="rounded bg-blue-600 px-4 py-2 text-white"
      >
        Join Room
      </button>

      <p>{message}</p>
    </main>
  );
}
