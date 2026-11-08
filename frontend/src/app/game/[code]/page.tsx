"use client";

import ChatPanel from "@/components/game/chat-panel";
import DrawingBoard from "@/components/game/drawing-board";
import GameHeader from "@/components/game/game-header";
import PlayersPanel from "@/components/game/players-panel";
import WordDisplay from "@/components/game/word-display";
import { useParams } from "next/navigation";

const GamePage = () => {
  const params = useParams<{ code: string }>();

  return (
    <main className="min-h-screen bg-background p-4 text-foreground md:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <GameHeader code={params.code} />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_280px]">
          <div className="flex flex-col gap-5">
            <WordDisplay />

            <DrawingBoard code={params.code} />
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
