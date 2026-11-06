"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { socket } from "@/lib/socket";

interface Participant {
  playerId: string;
  username: string;
  role: "host" | "player";
}

interface RoomUpdatedData {
  code: string;
  participants: Participant[];
}

interface RoomErrorData {
  message: string;
}

export default function LobbyPage() {
  const params = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const roomCode = params.code?.toUpperCase();
  const playerId = searchParams.get("playerId");

  const [players, setPlayers] = useState<Participant[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);

  // Connect to Socket.IO and join the room
  useEffect(() => {
    if (!roomCode || !playerId) {
      setError("Missing room information.");
      return;
    }

    const joinRoom = () => {
      socket.emit("room:join", {
        code: roomCode,
        playerId,
      });
    };

    const handleRoomLeft = () => {
      socket.disconnect();
      router.push("/");
    };

    const handleConnect = () => {
      setConnected(true);
      setError("");
      joinRoom();
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    const handleRoomUpdated = (data: RoomUpdatedData) => {
      if (data.code === roomCode) {
        setPlayers(data.participants);
        console.log("as", players);
      }
    };

    const handleRoomError = (data: RoomErrorData) => {
      setError(data.message);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("room:updated", handleRoomUpdated);
    socket.on("room:error", handleRoomError);
    socket.on("room:left", handleRoomLeft);

    if (socket.connected) {
      handleConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("room:updated", handleRoomUpdated);
      socket.off("room:error", handleRoomError);
      socket.off("room:left", handleRoomLeft);
    };
  }, [roomCode, playerId]);

  // Copy room code
  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Unable to copy room code.");
    }
  };

  // Leave lobby
  const handleLeaveRoom = () => {
    if (!socket.connected) {
      router.push("/");
      return;
    }

    socket.emit("room:leave", {
      code: roomCode,
      playerId,
    });
  };
  const isHost = players.find((p) => p.playerId === playerId)?.role === "host";
  console.log(isHost);

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-10 flex items-center justify-between">
          <h1 className="font-dyna text-3xl font-bold text-primary">
            Scribble 🎨
          </h1>

          <button
            onClick={handleLeaveRoom}
            className="rounded-xl border border-border px-4 py-2 text-sm transition hover:bg-background"
          >
            Leave Room
          </button>
        </header>

        {/* Room Information */}
        <section className="mb-8 rounded-3xl border border-border bg-card p-6 text-center shadow-sm">
          <p className="mb-2 text-sm text-foreground/60">YOUR ROOM CODE</p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <h2 className="font-dyna text-4xl font-bold tracking-widest text-primary">
              {roomCode}
            </h2>

            <button
              onClick={copyRoomCode}
              className="rounded-xl border border-border px-3 py-2 text-sm transition hover:bg-background"
            >
              {copied ? "Copied ✓" : "Copy 📋"}
            </button>
          </div>

          <p className="mt-4 text-sm text-foreground/60">
            Share this code with your friends!
          </p>
        </section>

        {/* Players */}
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-dyna text-2xl font-bold">Players</h2>

              <p className="mt-1 text-sm text-foreground/60">
                Everyone ready to draw?
              </p>
            </div>

            <span className="rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
              {players.length}/8
            </span>
          </div>

          {/* Player List */}
          <div className="space-y-3">
            {players.length > 0 ? (
              players.map((player) => (
                <div
                  key={player.playerId}
                  className="flex items-center justify-between rounded-2xl border border-border bg-background p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-xl">
                      🎨
                    </div>

                    <span className="font-semibold">{player.username}</span>
                  </div>

                  {player.role === "host" && (
                    <span className="rounded-full bg-yellow-400/20 px-3 py-1 text-xs font-bold text-yellow-600">
                      HOST 👑
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-foreground/50">
                {connected ? "Waiting for players..." : "Connecting to room..."}
              </p>
            )}
          </div>

          {/* Connection Status */}
          <div className="mt-6 flex items-center justify-center gap-2 text-sm">
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? "bg-green-500" : "bg-yellow-500"
              }`}
            />

            <span className="text-foreground/60">
              {connected ? "Connected" : "Connecting..."}
            </span>
          </div>

          {/* Error */}
          {error && (
            <p className="mt-4 text-center text-sm text-red-500">{error}</p>
          )}

          {/* Waiting Message */}
          <div className="mt-8 rounded-2xl bg-primary/10 p-5 text-center">
            <p className="font-dyna text-lg font-bold">
              Waiting for players...
            </p>

            <p className="mt-1 text-sm text-foreground/60">
              Invite your friends to join the fun!
            </p>
          </div>

          {/* Start Game */}
          <button
            disabled={isHost ? true : false}
            className="mt-6 w-full cursor-not-allowed rounded-2xl bg-primary py-4 font-dyna text-lg font-bold text-white opacity-60"
          >
            Start Game 🚀
          </button>

          <p className="mt-3 text-center text-xs text-foreground/50">
            Only the host can start the game.
          </p>
        </section>
      </div>
    </main>
  );
}
