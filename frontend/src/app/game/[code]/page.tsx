"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

import ChatPanel from "@/components/game/chat-panel";
import DrawingBoard from "@/components/game/drawing-board";
import GameHeader from "@/components/game/game-header";
import PlayersPanel from "@/components/game/players-panel";
import WordDisplay from "@/components/game/word-display";

import { socket } from "@/lib/socket";

interface GameStartedPayload {
  code: string;
  status: "playing";
  currentRound: number;
  currentArtist: string;
  roundEndsAt: string | null;
}

interface WordSelectedPayload {
  word?: string;
  hint?: string;
}

const GamePage = () => {
  const params = useParams<{ code: string }>();
  const searchParams = useSearchParams();

  const code = params.code.toUpperCase();
  const playerId = searchParams.get("playerId");

  const [word, setWord] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [currentArtist, setCurrentArtist] = useState<string | null>(null);
  const [gameError, setGameError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(socket.connected);

  const handleGameStarted = useCallback(
    (data: GameStartedPayload) => {
      if (data.code !== code) return;

      setCurrentArtist(data.currentArtist);
      setGameError(null);
    },
    [code],
  );

  const handleWordSelected = useCallback((data: WordSelectedPayload) => {
    setWord(data.word ?? null);
    setHint(data.hint ?? null);
  }, []);

  const handleGameError = useCallback((data: { message: string }) => {
    setGameError(data.message);
  }, []);

  useEffect(() => {
    if (!playerId) {
      setGameError("Player information is missing.");
      return;
    }

    const handleConnect = () => {
      setIsConnected(true);

      socket.emit("game:sync", {
        code,
        playerId,
      });
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    socket.on("game:started", handleGameStarted);
    socket.on("game:word-selected", handleWordSelected);
    socket.on("game:error", handleGameError);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    if (socket.connected) {
      setIsConnected(true);

      socket.emit("game:sync", {
        code,
        playerId,
      });
    } else {
      setIsConnected(false);
      socket.connect();
    }

    return () => {
      socket.off("game:started", handleGameStarted);
      socket.off("game:word-selected", handleWordSelected);
      socket.off("game:error", handleGameError);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [code, playerId, handleGameStarted, handleWordSelected, handleGameError]);

  const isArtist = currentArtist === playerId;

  return (
    <main className="min-h-screen bg-background p-4 text-foreground md:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <GameHeader code={code} />

        {!isConnected && (
          <p className="rounded-lg bg-yellow-500/10 p-3 text-sm text-yellow-600">
            Connecting to the game...
          </p>
        )}

        {gameError && (
          <p
            role="alert"
            className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500"
          >
            {gameError}
          </p>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_280px]">
          <div className="flex flex-col gap-5">
            <WordDisplay word={word} hint={hint} isArtist={isArtist} />

            <DrawingBoard code={code} />
          </div>

          <div className="flex flex-col gap-5">
            <PlayersPanel />
            <ChatPanel />
          </div>
        </div>
      </div>
    </main>
  );
};

export default GamePage;
